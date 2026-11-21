import { randomUUID } from "node:crypto";
import { enqueueDeployment } from "@enerthya/core/queue";
import {
  applicationInOrganization,
  type Database,
  type DeploymentSummary,
  getDb,
  insertDeployment,
  type RollbackCandidate,
  selectDeployments,
  selectRollbackCandidate,
  selectRollbackCandidates,
  transitionDeployment,
} from "@enerthya/db";

export type DeploymentRow = DeploymentSummary;

/** The deployment row was written, but Redis refused the job. */
export class QueueUnavailableError extends Error {}

/** Nothing has run for this application, so there is nothing to go back to. */
export class RollbackUnavailableError extends Error {}

export function listDeployments(organizationId: string): Promise<DeploymentRow[]> {
  return selectDeployments(getDb(), organizationId);
}

/** One entry per application that has a deployment worth returning to. */
export function listRollbackCandidates(organizationId: string): Promise<RollbackCandidate[]> {
  return selectRollbackCandidates(getDb(), organizationId);
}

/**
 * Writes the row first, then hands it to the worker. If Redis is down the
 * history shows a failed deployment with the reason instead of losing the
 * request entirely.
 */
async function recordAndEnqueue(
  db: Database,
  input: { id: string; applicationId: string; imageTag?: string; rollbackOfId?: string },
): Promise<string> {
  await insertDeployment(db, input);

  const redisUrl = process.env.REDIS_URL;
  try {
    if (!redisUrl) throw new Error("REDIS_URL is not set in the panel's environment.");
    await enqueueDeployment(redisUrl, input.id);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "The queue is unreachable.";
    await transitionDeployment(db, input.id, ["queued"], "failed", {
      error: `The deployment could not be queued: ${reason}`,
      finishedAt: new Date(),
    });
    throw new QueueUnavailableError(reason);
  }

  return input.id;
}

export async function startDeployment(
  organizationId: string,
  applicationId: string,
): Promise<string> {
  const db = getDb();
  if (!(await applicationInOrganization(db, organizationId, applicationId))) {
    throw new Error("Application not found");
  }
  return recordAndEnqueue(db, { id: randomUUID(), applicationId });
}

/**
 * Queues the image of the newest deployment that reached `running`. The new
 * row records which deployment it undoes, so the history explains itself.
 */
export async function startRollback(
  organizationId: string,
  applicationId: string,
): Promise<string> {
  const db = getDb();
  if (!(await applicationInOrganization(db, organizationId, applicationId))) {
    throw new Error("Application not found");
  }

  const candidate = await selectRollbackCandidate(db, organizationId, applicationId);
  if (!candidate) {
    throw new RollbackUnavailableError(
      "This application has no deployment that reached running, so there is nothing to roll back to.",
    );
  }

  return recordAndEnqueue(db, {
    id: randomUUID(),
    applicationId,
    imageTag: candidate.imageTag,
    rollbackOfId: candidate.deploymentId,
  });
}
