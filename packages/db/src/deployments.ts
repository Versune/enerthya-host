import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import type { Database } from "./client";
import { applications, deployments, environments, projects } from "./schema";

export type DeploymentStatus = (typeof deployments.$inferSelect)["status"];

export type DeploymentSummary = {
  id: string;
  applicationId: string;
  applicationName: string;
  projectName: string;
  environmentSlug: string;
  status: DeploymentStatus;
  commitSha: string | null;
  imageTag: string | null;
  containerId: string | null;
  rollbackOfId: string | null;
  error: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
};

export type DeploymentTarget = {
  deploymentId: string;
  applicationId: string;
  applicationName: string;
  applicationSlug: string;
  environmentId: string;
  sourceType: (typeof applications.$inferSelect)["sourceType"];
  gitUrl: string | null;
  gitBranch: string;
  dockerImage: string | null;
  buildType: (typeof applications.$inferSelect)["buildType"];
  port: number;
  healthcheckPath: string;
  /** Set when a rollback already chose the image this deployment must run. */
  presetImage: string | null;
  deployKeyEncrypted: string | null;
};

/** Deployment history for one organization, newest first. */
export async function selectDeployments(
  db: Database,
  organizationId: string,
  limit = 50,
): Promise<DeploymentSummary[]> {
  return db
    .select({
      id: deployments.id,
      applicationId: deployments.applicationId,
      applicationName: applications.name,
      projectName: projects.name,
      environmentSlug: environments.slug,
      status: deployments.status,
      commitSha: deployments.commitSha,
      imageTag: deployments.imageTag,
      containerId: deployments.containerId,
      rollbackOfId: deployments.rollbackOfId,
      error: deployments.error,
      startedAt: deployments.startedAt,
      finishedAt: deployments.finishedAt,
      createdAt: deployments.createdAt,
    })
    .from(deployments)
    .innerJoin(applications, eq(deployments.applicationId, applications.id))
    .innerJoin(environments, eq(applications.environmentId, environments.id))
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(eq(projects.organizationId, organizationId))
    .orderBy(desc(deployments.createdAt))
    .limit(limit);
}

/**
 * Confirms the application belongs to the organization before a deployment is
 * queued for it. The organization comes from the session, never the request.
 */
export async function applicationInOrganization(
  db: Database,
  organizationId: string,
  applicationId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: applications.id })
    .from(applications)
    .innerJoin(environments, eq(applications.environmentId, environments.id))
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(and(eq(applications.id, applicationId), eq(projects.organizationId, organizationId)))
    .limit(1);
  return Boolean(row);
}

export async function insertDeployment(
  db: Database,
  input: { id: string; applicationId: string; imageTag?: string; rollbackOfId?: string },
): Promise<void> {
  await db.insert(deployments).values(input);
}

/**
 * Moves a deployment from one state to the next, but only from the state the
 * caller believes it is in. Two workers racing for one job, or a worker that
 * restarts mid-deploy, cannot apply a transition twice.
 */
export async function transitionDeployment(
  db: Database,
  id: string,
  from: DeploymentStatus[],
  to: DeploymentStatus,
  patch: { error?: string; startedAt?: Date; finishedAt?: Date } = {},
): Promise<boolean> {
  const rows = await db
    .update(deployments)
    .set({ status: to, ...patch })
    .where(and(eq(deployments.id, id), inArray(deployments.status, from)))
    .returning({ id: deployments.id });
  return rows.length > 0;
}

export async function setDeploymentSource(
  db: Database,
  id: string,
  source: { commitSha?: string; imageTag?: string },
): Promise<void> {
  await db.update(deployments).set(source).where(eq(deployments.id, id));
}

export async function setDeploymentRuntime(
  db: Database,
  id: string,
  runtime: { containerId?: string; imageTag?: string; hostPort?: number },
): Promise<void> {
  await db.update(deployments).set(runtime).where(eq(deployments.id, id));
}

/** What the worker needs to run a deployment, independent of any organization. */
export async function selectDeploymentTarget(
  db: Database,
  deploymentId: string,
): Promise<DeploymentTarget | null> {
  const [row] = await db
    .select({
      deploymentId: deployments.id,
      applicationId: applications.id,
      applicationName: applications.name,
      applicationSlug: applications.slug,
      environmentId: applications.environmentId,
      sourceType: applications.sourceType,
      gitUrl: applications.gitUrl,
      gitBranch: applications.gitBranch,
      dockerImage: applications.dockerImage,
      buildType: applications.buildType,
      port: applications.port,
      healthcheckPath: applications.healthcheckPath,
      presetImage: deployments.imageTag,
      deployKeyEncrypted: applications.deployKeyEncrypted,
    })
    .from(deployments)
    .innerJoin(applications, eq(deployments.applicationId, applications.id))
    .where(eq(deployments.id, deploymentId))
    .limit(1);
  return row ?? null;
}

export type RollbackCandidate = {
  applicationId: string;
  deploymentId: string;
  imageTag: string;
  finishedAt: Date | null;
};

/**
 * The deployments a rollback can return to: the ones that reached `running` and
 * recorded the image that was actually served. One per application — the newest.
 */
export async function selectRollbackCandidates(
  db: Database,
  organizationId: string,
): Promise<RollbackCandidate[]> {
  const rows = await db
    .select({
      applicationId: deployments.applicationId,
      deploymentId: deployments.id,
      imageTag: deployments.imageTag,
      finishedAt: deployments.finishedAt,
    })
    .from(deployments)
    .innerJoin(applications, eq(deployments.applicationId, applications.id))
    .innerJoin(environments, eq(applications.environmentId, environments.id))
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(
      and(
        eq(projects.organizationId, organizationId),
        eq(deployments.status, "running"),
        isNotNull(deployments.imageTag),
      ),
    )
    .orderBy(desc(deployments.finishedAt));

  // Newest first. The candidate is the newest deployment that ran a different
  // image than the one serving now — going back one version, not re-running the
  // version that just succeeded. With a single image, that image is the answer:
  // it restarts an application whose container is gone.
  const byApplication = new Map<string, RollbackCandidate[]>();
  for (const row of rows) {
    if (!row.imageTag) continue;
    const list = byApplication.get(row.applicationId) ?? [];
    list.push({ ...row, imageTag: row.imageTag });
    byApplication.set(row.applicationId, list);
  }

  const candidates: RollbackCandidate[] = [];
  for (const list of byApplication.values()) {
    const current = list[0] as RollbackCandidate;
    const previous = list.find((entry) => entry.imageTag !== current.imageTag) ?? current;
    candidates.push(previous);
  }
  return candidates;
}

export async function selectRollbackCandidate(
  db: Database,
  organizationId: string,
  applicationId: string,
): Promise<RollbackCandidate | null> {
  const candidates = await selectRollbackCandidates(db, organizationId);
  return candidates.find((candidate) => candidate.applicationId === applicationId) ?? null;
}
