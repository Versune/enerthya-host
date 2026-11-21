import { and, asc, eq } from "drizzle-orm";
import type { Database } from "./client";
import { applications, environments, projects } from "./schema";

export type ApplicationSummary = {
  id: string;
  name: string;
  slug: string;
  sourceType: "git" | "image";
  gitUrl: string | null;
  gitBranch: string;
  dockerImage: string | null;
  buildType: "dockerfile" | "nixpacks" | "docker-compose";
  port: number;
  healthcheckPath: string;
  environmentId: string;
  environmentName: string;
  environmentSlug: string;
  projectId: string;
  projectName: string;
};

export async function selectApplications(
  db: Database,
  organizationId: string,
): Promise<ApplicationSummary[]> {
  return db
    .select({
      id: applications.id,
      name: applications.name,
      slug: applications.slug,
      sourceType: applications.sourceType,
      gitUrl: applications.gitUrl,
      gitBranch: applications.gitBranch,
      dockerImage: applications.dockerImage,
      buildType: applications.buildType,
      port: applications.port,
      healthcheckPath: applications.healthcheckPath,
      environmentId: applications.environmentId,
      environmentName: environments.name,
      environmentSlug: environments.slug,
      projectId: projects.id,
      projectName: projects.name,
    })
    .from(applications)
    .innerJoin(environments, eq(applications.environmentId, environments.id))
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(eq(projects.organizationId, organizationId))
    .orderBy(asc(projects.name), asc(environments.slug), asc(applications.name));
}

export async function selectApplication(
  db: Database,
  organizationId: string,
  applicationId: string,
): Promise<ApplicationSummary | null> {
  const [row] = await db
    .select({
      id: applications.id,
      name: applications.name,
      slug: applications.slug,
      sourceType: applications.sourceType,
      gitUrl: applications.gitUrl,
      gitBranch: applications.gitBranch,
      dockerImage: applications.dockerImage,
      buildType: applications.buildType,
      port: applications.port,
      healthcheckPath: applications.healthcheckPath,
      environmentId: applications.environmentId,
      environmentName: environments.name,
      environmentSlug: environments.slug,
      projectId: projects.id,
      projectName: projects.name,
    })
    .from(applications)
    .innerJoin(environments, eq(applications.environmentId, environments.id))
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(and(eq(applications.id, applicationId), eq(projects.organizationId, organizationId)))
    .limit(1);
  return row ?? null;
}

export async function environmentBelongsTo(
  db: Database,
  organizationId: string,
  environmentId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: environments.id })
    .from(environments)
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(and(eq(environments.id, environmentId), eq(projects.organizationId, organizationId)))
    .limit(1);
  return rows.length > 0;
}

export async function applicationSlugTaken(
  db: Database,
  environmentId: string,
  slug: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.environmentId, environmentId), eq(applications.slug, slug)))
    .limit(1);
  return rows.length > 0;
}

export async function insertApplication(
  db: Database,
  values: typeof applications.$inferInsert,
): Promise<string> {
  const [row] = await db.insert(applications).values(values).returning({ id: applications.id });
  if (!row) throw new Error("The application could not be stored");
  return row.id;
}

export async function removeApplication(
  db: Database,
  organizationId: string,
  id: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: applications.id })
    .from(applications)
    .innerJoin(environments, eq(applications.environmentId, environments.id))
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(and(eq(applications.id, id), eq(projects.organizationId, organizationId)))
    .limit(1);
  if (rows.length === 0) return false;

  const deleted = await db
    .delete(applications)
    .where(eq(applications.id, id))
    .returning({ id: applications.id });
  return deleted.length > 0;
}

export type DeployHook = {
  id: string;
  name: string;
  gitBranch: string;
  autoDeploy: boolean;
  webhookSecret: string | null;
};

export async function selectDeployHook(
  db: Database,
  applicationId: string,
): Promise<DeployHook | null> {
  const [row] = await db
    .select({
      id: applications.id,
      name: applications.name,
      gitBranch: applications.gitBranch,
      autoDeploy: applications.autoDeploy,
      webhookSecret: applications.webhookSecret,
    })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);
  return row ?? null;
}
