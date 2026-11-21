import {
  getDb,
  selectDeploymentTarget,
  setDeploymentSource,
  transitionDeployment,
} from "@enerthya/db";
import { resolveGitHead } from "./git";

/**
 * The worker has no container runtime wired yet, so a deployment stops here.
 * The message is the truth the Deployments screen shows: the source was read,
 * nothing was built and no container exists.
 */
export const NO_RUNTIME =
  "The source was resolved, but this worker is not connected to a container runtime yet. Nothing was built and no container was created.";

/**
 * Runs one deployment. The first transition claims the job: a second worker,
 * a retried job or a worker restarted mid-deploy finds the row already out of
 * `queued` and leaves it alone.
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

  try {
    if (target.sourceType === "git") {
      if (!target.gitUrl) throw new Error("The application has no repository URL.");
      const commitSha = await resolveGitHead(target.gitUrl, target.gitBranch);
      if (!commitSha) {
        throw new Error(
          `No commit found for branch ${target.gitBranch} in ${target.gitUrl}. Check the branch name.`,
        );
      }
      await setDeploymentSource(db, deploymentId, { commitSha });
    }

    // Build, healthcheck and the container swap belong to the runtime slice.
    await transitionDeployment(db, deploymentId, ["building"], "deploying");
    await transitionDeployment(db, deploymentId, ["deploying"], "failed", {
      error: NO_RUNTIME,
      finishedAt: new Date(),
    });
  } catch (error) {
    await transitionDeployment(db, deploymentId, ["building", "deploying"], "failed", {
      error: error instanceof Error ? error.message : "The deployment failed.",
      finishedAt: new Date(),
    });
  }
}
