import { randomUUID } from "node:crypto";
import { enqueueDeployment } from "@enerthya/core/queue";
import {
  applicationInOrganization,
  type DeploymentSummary,
  getDb,
  insertDeployment,
  selectDeployments,
  transitionDeployment,
} from "@enerthya/db";

export type DeploymentRow = DeploymentSummary;

/** The deployment row was written, but Redis refused the job. */
export class QueueUnavailableError extends Error {}

export function listDeployments(organizationId: string): Promise<DeploymentRow[]> {
  return selectDeployments(getDb(), organizationId);
}

/**
 * Records a deployment and hands it to the worker. The row is written first:
 * if Redis is down, the history shows a failed deployment with the reason
 * instead of losing the request entirely.
 */
export async function startDeployment(
  organizationId: string,
  applicationId: string,
): Promise<string> {
  const db = getDb();
  if (!(await applicationInOrganization(db, organizationId, applicationId))) {
    throw new Error("Application not found");
  }

  const id = randomUUID();
  await insertDeployment(db, { id, applicationId });

  const redisUrl = process.env.REDIS_URL;
  try {
    if (!redisUrl) throw new Error("REDIS_URL is not set in the panel's environment.");
    await enqueueDeployment(redisUrl, id);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "The queue is unreachable.";
    await transitionDeployment(db, id, ["queued"], "failed", {
      error: `The deployment could not be queued: ${reason}`,
      finishedAt: new Date(),
    });
    throw new QueueUnavailableError(reason);
  }

  return id;
}
