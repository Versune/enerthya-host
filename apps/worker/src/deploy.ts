import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildImage,
  connectRuntime,
  containerName,
  createAndStart,
  listApplicationContainers,
  missingRuntimeMessage,
  pullImage,
  type RuntimeConnection,
  stopAndRemove,
  waitForHealthy,
} from "@enerthya/core/runtime";
import {
  type DeploymentTarget,
  getDb,
  selectDeploymentTarget,
  setDeploymentRuntime,
  setDeploymentSource,
  transitionDeployment,
} from "@enerthya/db";
import { execa } from "execa";
import { imageTagFor } from "./naming";

/**
 * Clones one branch into `dir` and returns the commit that was cloned. The
 * clone is shallow: a deployment needs the tip of a branch, not its history,
 * and the command never prompts for a password.
 */
export async function cloneRepository(url: string, branch: string, dir: string): Promise<string> {
  const clone = await execa("git", ["clone", "--depth", "1", "--branch", branch, url, dir], {
    timeout: 120_000,
    reject: false,
    env: {
      GIT_TERMINAL_PROMPT: "0",
      GIT_SSH_COMMAND: "ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new",
    },
  });
  if (clone.exitCode !== 0) {
    const detail = clone.stderr.trim() || `git exited with ${clone.exitCode}`;
    throw new Error(`Could not clone ${url} (${branch}): ${detail}`);
  }

  const head = await execa("git", ["rev-parse", "HEAD"], { cwd: dir, timeout: 30_000 });
  return head.stdout.trim();
}

/**
 * Runs one deployment end to end: source → image → container → health check →
 * swap. The first transition claims the job, so a second worker, a retried job
 * or a worker restarted mid-deploy finds the row already out of `queued` and
 * leaves it alone.
 *
 * A failure removes the container this deployment created and leaves the
 * previous one running: a broken release never takes traffic away from a
 * working one.
 */
export async function runDeployment(deploymentId: string): Promise<void> {
  const db = getDb();

  const claimed = await transitionDeployment(db, deploymentId, ["queued"], "building", {
    startedAt: new Date(),
  });
  if (!claimed) return;

  const target = await selectDeploymentTarget(db, deploymentId);
  if (!target) {
    await transitionDeployment(db, deploymentId, ["building"], "failed", {
      error: "The application this deployment belongs to no longer exists.",
      finishedAt: new Date(),
    });
    return;
  }

  let runtime: RuntimeConnection | null = null;
  try {
    runtime = await connectRuntime();
  } catch (error) {
    await transitionDeployment(db, deploymentId, ["building"], "failed", {
      error: error instanceof Error ? error.message : missingRuntimeMessage(),
      finishedAt: new Date(),
    });
    return;
  }
  if (!runtime) {
    await transitionDeployment(db, deploymentId, ["building"], "failed", {
      error: missingRuntimeMessage(),
      finishedAt: new Date(),
    });
    return;
  }

  let contextDir: string | null = null;
  let containerId: string | null = null;

  try {
    const image = await prepareImage(runtime, target, deploymentId, (dir) => {
      contextDir = dir;
    });
    await setDeploymentRuntime(db, deploymentId, { imageTag: image });

    await transitionDeployment(db, deploymentId, ["building"], "deploying");
    const started = await createAndStart(runtime.client, {
      name: containerName(target.applicationSlug, deploymentId),
      image,
      containerPort: target.port,
      labels: {
        "enerthya.managed": "true",
        "enerthya.application": target.applicationId,
        "enerthya.environment": target.environmentId,
        "enerthya.deployment": deploymentId,
      },
    });
    containerId = started.id;
    await setDeploymentRuntime(db, deploymentId, { containerId });

    await transitionDeployment(db, deploymentId, ["deploying"], "healthcheck");
    await waitForHealthy(`http://127.0.0.1:${started.hostPort}${target.healthcheckPath}`);

    // The new container answers, so the older ones for this application can go.
    for (const container of await listApplicationContainers(runtime.client, target.applicationId)) {
      if (container.id !== containerId) await stopAndRemove(runtime.client, container.id);
    }

    await transitionDeployment(db, deploymentId, ["healthcheck"], "running", {
      finishedAt: new Date(),
    });
  } catch (error) {
    if (containerId) {
      await stopAndRemove(runtime.client, containerId).catch(() => undefined);
      containerId = null;
    }
    await transitionDeployment(
      db,
      deploymentId,
      ["building", "deploying", "healthcheck"],
      "failed",
      {
        error: error instanceof Error ? error.message : "The deployment failed.",
        finishedAt: new Date(),
      },
    );
  } finally {
    if (contextDir) await rm(contextDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function prepareImage(
  runtime: RuntimeConnection,
  target: DeploymentTarget,
  deploymentId: string,
  onContext: (dir: string) => void,
): Promise<string> {
  if (target.sourceType === "image") {
    if (!target.dockerImage) throw new Error("The application has no image reference.");
    await pullImage(runtime.client, target.dockerImage);
    return target.dockerImage;
  }

  if (!target.gitUrl) throw new Error("The application has no repository URL.");
  if (target.buildType !== "dockerfile") {
    throw new Error(
      `${target.buildType} builds are not implemented yet. Choose Dockerfile, or deploy an image directly.`,
    );
  }

  const dir = await mkdtemp(join(tmpdir(), "enerthya-"));
  onContext(dir);
  const commitSha = await cloneRepository(target.gitUrl, target.gitBranch, dir);
  await setDeploymentSource(getDb(), deploymentId, { commitSha });

  const image = imageTagFor(target.applicationSlug, deploymentId);
  await buildImage(runtime.client, dir, image);
  return image;
}
