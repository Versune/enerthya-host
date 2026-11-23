import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decryptSecret } from "@enerthya/core/crypto";
import { publishRoutes } from "@enerthya/core/proxy";
import { redactCredentials } from "@enerthya/core/redact";
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
  appendDeploymentLog,
  applicationHasDomains,
  type DeploymentTarget,
  getDb,
  recordStep,
  selectDeploymentTarget,
  selectDomainRoutes,
  selectEncryptedEnvVars,
  selectSteps,
  setDeploymentRuntime,
  setDeploymentSource,
  transitionDeployment,
} from "@enerthya/db";
import { execa } from "execa";
import { isStepDone } from "./deploy-steps";
import { imageTagFor } from "./naming";
import { notifyFailure } from "./notify";

/**
 * Clones one branch into `dir` and returns the commit that was cloned. The
 * clone is shallow: a deployment needs the tip of a branch, not its history,
 * and the command never prompts for a password.
 */
export async function cloneRepository(
  url: string,
  branch: string,
  dir: string,
  privateKey?: string,
): Promise<string> {
  let keyDir: string | null = null;
  try {
    let sshCommand = "ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new";
    if (privateKey) {
      keyDir = await mkdtemp(join(tmpdir(), "enerthya-key-"));
      const keyFile = join(keyDir, "deploy_key");
      await writeFile(keyFile, privateKey, { mode: 0o600 });
      // IdentitiesOnly: an agent on the host must not offer a different key.
      sshCommand = `ssh -i ${keyFile} -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=accept-new`;
    }

    const clone = await execa("git", ["clone", "--depth", "1", "--branch", branch, url, dir], {
      timeout: 120_000,
      reject: false,
      env: { GIT_TERMINAL_PROMPT: "0", GIT_SSH_COMMAND: sshCommand },
    });
    if (clone.exitCode !== 0) {
      const detail = clone.stderr.trim() || `git exited with ${clone.exitCode}`;
      throw new Error(`Could not clone ${redactCredentials(url)} (${branch}): ${detail}`);
    }

    const head = await execa("git", ["rev-parse", "HEAD"], { cwd: dir, timeout: 30_000 });
    return head.stdout.trim();
  } finally {
    if (keyDir) await rm(keyDir, { recursive: true, force: true }).catch(() => undefined);
  }
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
export async function runDeployment(
  deploymentId: string,
  options: { resume?: boolean } = {},
): Promise<void> {
  const db = getDb();
  const resume = options.resume === true;

  // A fresh request may only claim `queued`. A resume is the reconciler saying
  // this deployment was interrupted, so it may claim the states this worker
  // itself owns — and nothing else: `running` is already serving, `failed` is
  // somebody's decision.
  const claimed = resume
    ? await transitionDeployment(
        db,
        deploymentId,
        ["building", "deploying", "healthcheck"],
        "building",
      )
    : await transitionDeployment(db, deploymentId, ["queued"], "building", {
        startedAt: new Date(),
      });
  if (!claimed) return;

  const log = (line: string) => appendDeploymentLog(db, deploymentId, line).catch(() => undefined);
  await log("Deployment claimed by the worker.");
  // Set when this run moved the row to `running`. A failure after that point
  // has to hand the route back, not only mark the deployment failed.
  let promoted = false;

  const target = await selectDeploymentTarget(db, deploymentId);
  if (!target) {
    await log("The application no longer exists.");
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
    await log(missingRuntimeMessage());
    await transitionDeployment(db, deploymentId, ["building"], "failed", {
      error: missingRuntimeMessage(),
      finishedAt: new Date(),
    });
    return;
  }
  await log(`Runtime: ${runtime.kind} at ${runtime.address}.`);

  let contextDir: string | null = null;
  let containerId: string | null = null;
  // The step this run is in, so a failure records which one broke.
  let currentStep: "image" | "container" | "health" | "swap" = "image";

  try {
    const variables = await loadEnvVars(target.applicationId);
    const steps = resume ? await selectSteps(db, deploymentId) : [];
    if (resume) {
      const finished = steps.filter((step) => step.status === "done").map((step) => step.name);
      await log(`Resuming: ${finished.length > 0 ? finished.join(", ") : "no step finished"}.`);
    }

    currentStep = "image";
    let image: string;
    if (isStepDone(steps, "image") && target.presetImage) {
      // The bundle that survived the interruption is the one this deployment
      // builds; cloning and building again would produce a second image and a
      // second wait for nothing.
      image = target.presetImage;
      await log(`Image already built: ${image}.`);
    } else {
      await log(
        target.presetImage
          ? `Rollback: running the image ${target.presetImage}.`
          : `Source: ${target.sourceType === "git" ? `${redactCredentials(target.gitUrl ?? "")} (${target.gitBranch})` : target.dockerImage}.`,
      );
      image = await prepareImage(
        runtime,
        target,
        deploymentId,
        (dir) => {
          contextDir = dir;
        },
        variables.build,
      );
      await setDeploymentRuntime(db, deploymentId, { imageTag: image });
      await recordStep(db, deploymentId, "image", "done");
      await log(`Image ready: ${image}.`);
    }

    await transitionDeployment(db, deploymentId, ["building"], "deploying");
    currentStep = "container";
    let hostPort = 0;
    // The container name is deterministic for a deployment, so a resumed run
    // can look for the one it already started instead of starting another.
    const name = containerName(target.applicationSlug, deploymentId);
    if (isStepDone(steps, "container")) {
      const existing = await runtime.client
        .getContainer(name)
        .inspect()
        .catch(() => null);
      const published = existing?.NetworkSettings?.Ports?.[`${target.port}/tcp`]?.[0]?.HostPort;
      // A service publishes nothing, so its container is reusable when it is
      // simply alive.
      const reusable =
        existing && (target.kind === "service" ? existing.State?.Running : !!published);
      if (existing && reusable) {
        containerId = existing.Id;
        hostPort = published ? Number(published) : 0;
        await setDeploymentRuntime(db, deploymentId, { containerId, hostPort });
        await log(`Container already running: ${containerId.slice(0, 12)} on port ${hostPort}.`);
      }
    }
    if (!containerId) {
      const service = target.kind === "service";
      const started = await createAndStart(runtime.client, {
        name,
        image,
        containerPort: target.port,
        publishPort: !service,
        volumes: target.volumes ?? undefined,
        labels: {
          "enerthya.managed": "true",
          "enerthya.application": target.applicationId,
          "enerthya.environment": target.environmentId,
          "enerthya.deployment": deploymentId,
        },
        env: variables.runtime,
      });
      containerId = started.id;
      hostPort = started.hostPort;
      await setDeploymentRuntime(db, deploymentId, { containerId, hostPort });
      await recordStep(db, deploymentId, "container", "done");
      await log(
        service
          ? `Service container started: ${containerId.slice(0, 12)}.`
          : `Container started on host port ${hostPort}.`,
      );
    }

    await transitionDeployment(db, deploymentId, ["deploying"], "healthcheck");
    currentStep = "health";
    if (isStepDone(steps, "health")) {
      await log("Health check already passed.");
    } else if (target.kind === "service") {
      // A background process has no HTTP surface: "healthy" means it is still
      // running a moment after start, not that it answers a path.
      if (!containerId) throw new Error("The service container is missing.");
      await log("Service started; waiting for it to stay up.");
      await waitForRunning(runtime.client, containerId, 20_000);
      await recordStep(db, deploymentId, "health", "done");
    } else {
      await log(`Health check: ${target.healthcheckPath} on port ${hostPort}.`);
      await waitForHealthy(`http://127.0.0.1:${hostPort}${target.healthcheckPath}`);
      await recordStep(db, deploymentId, "health", "done");
    }

    await log(target.kind === "service" ? "Service is up." : "Health check passed.");

    // The row becomes `running` before the proxy is touched, because
    // selectDomainRoutes resolves the newest running deployment: this is the
    // moment the route table would answer with the new port. Publishing it is
    // what actually moves the traffic, and it happens while the previous
    // container is still up and answering.
    promoted = await transitionDeployment(db, deploymentId, ["healthcheck"], "running", {
      finishedAt: new Date(),
    });
    if (!promoted)
      throw new Error("The deployment left the health check before it could be promoted.");

    if (target.kind === "web" && (await applicationHasDomains(db, target.applicationId))) {
      await publishDomainRoutes({ strict: true });
      await log("Traffic moved to the new container.");
    }

    // Traffic is on the new container — or there was no proxy to move — so the
    // older containers for this application can go. Doing this any earlier
    // leaves a window where the proxy dials a port whose container is gone.
    for (const container of await listApplicationContainers(runtime.client, target.applicationId)) {
      if (container.id !== containerId) {
        await log(`Stopping the previous container ${container.id.slice(0, 12)}.`);
        await stopAndRemove(runtime.client, container.id);
      }
    }
    await recordStep(db, deploymentId, "swap", "done");
  } catch (error) {
    if (containerId) {
      await stopAndRemove(runtime.client, containerId).catch(() => undefined);
      containerId = null;
    }
    const message = error instanceof Error ? error.message : "The deployment failed.";
    await recordStep(db, deploymentId, currentStep, "failed", { error: message }).catch(
      () => undefined,
    );
    await log(`Failed: ${message}`);
    void notifyFailure(target.applicationId, {
      applicationName: target.applicationName,
      applicationId: target.applicationId,
      deploymentId,
      error: message,
    });
    await transitionDeployment(
      db,
      deploymentId,
      ["building", "deploying", "healthcheck", "running"],
      "failed",
      { error: message, finishedAt: new Date() },
    );
    // A deployment that failed after it was promoted must stop being the
    // route's answer: the previous deployment is still `running`, so
    // republishing hands the domain back to the container that never stopped.
    if (promoted) await publishDomainRoutes();
  } finally {
    if (contextDir) await rm(contextDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

/**
 * A service is ready when its process is still alive after it had time to
 * crash. The runtime restarts a container that exits, so the check looks at
 * the current state rather than trusting that start() returning meant success.
 */
async function waitForRunning(
  client: RuntimeConnection["client"],
  containerId: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last = "unknown";
  while (Date.now() < deadline) {
    const info = await client.getContainer(containerId).inspect();
    if (info.State?.Running && !info.State.Restarting) return;
    last = info.State?.Status ?? "unknown";
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `The service did not stay running within ${Math.round(timeoutMs / 1000)}s (last: ${last}).`,
  );
}

/** Loads every domain the panel knows about into the reverse proxy. */
async function publishDomainRoutes({ strict = false }: { strict?: boolean } = {}): Promise<void> {
  const adminUrl = process.env.CADDY_ADMIN_URL;
  // No admin URL means this worker does not run the proxy. The deployment still
  // succeeds there; the domain is simply not served from this machine.
  if (!adminUrl) return;
  try {
    await publishRoutes(adminUrl, await selectDomainRoutes(getDb()));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Strict is the swap: a deployment that cannot move the traffic must not be
    // reported as running, and the previous container must not be stopped.
    if (strict) throw new Error(`The proxy did not accept the new route: ${message}`);
    console.error(`[enerthya-worker] could not publish proxy routes: ${message}`);
  }
}

/**
 * Decrypts the application's variables and splits them the way the schema
 * promises: every one reaches the container, and the ones marked build-time
 * also reach the build. The panel never sees this plaintext.
 */
async function loadEnvVars(applicationId: string): Promise<{
  runtime: string[];
  build: Record<string, string>;
}> {
  const rows = await selectEncryptedEnvVars(getDb(), applicationId);
  const runtime: string[] = [];
  const build: Record<string, string> = {};
  for (const row of rows) {
    const value = decryptSecret(row.valueEncrypted);
    runtime.push(`${row.key}=${value}`);
    if (row.isBuildTime) build[row.key] = value;
  }
  return { runtime, build };
}

async function prepareImage(
  runtime: RuntimeConnection,
  target: DeploymentTarget,
  deploymentId: string,
  onContext: (dir: string) => void,
  buildArgs: Record<string, string> = {},
): Promise<string> {
  // A rollback decided the image when the deployment was queued: rebuild
  // nothing, run exactly what served before.
  if (target.presetImage) {
    await pullImage(runtime.client, target.presetImage);
    return target.presetImage;
  }

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
  const privateKey = target.deployKeyEncrypted
    ? decryptSecret(target.deployKeyEncrypted)
    : undefined;
  const commitSha = await cloneRepository(target.gitUrl, target.gitBranch, dir, privateKey);
  await setDeploymentSource(getDb(), deploymentId, { commitSha });

  const image = imageTagFor(target.applicationSlug, deploymentId);
  await buildImage(runtime.client, dir, image, "Dockerfile", buildArgs);
  return image;
}
