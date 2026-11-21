import { and, asc, eq } from "drizzle-orm";
import type { Database } from "./client";
import { environments, projects } from "./schema";

export type EnvironmentSummary = {
  id: string;
  name: string;
  slug: string;
  kind: "production" | "staging" | "preview";
};

export type ProjectSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  environments: EnvironmentSummary[];
};

/** One row per project; its environments are grouped in memory. */
export async function selectProjects(
  db: Database,
  organizationId: string,
): Promise<ProjectSummary[]> {
  const rows = await db
    .select({
      projectId: projects.id,
      name: projects.name,
      slug: projects.slug,
      description: projects.description,
      environmentId: environments.id,
      environmentName: environments.name,
      environmentSlug: environments.slug,
      environmentKind: environments.kind,
    })
    .from(projects)
    .leftJoin(environments, eq(environments.projectId, projects.id))
    .where(eq(projects.organizationId, organizationId))
    .orderBy(asc(projects.createdAt), asc(environments.kind));

  const byId = new Map<string, ProjectSummary>();
  for (const row of rows) {
    let project = byId.get(row.projectId);
    if (!project) {
      project = {
        id: row.projectId,
        name: row.name,
        slug: row.slug,
        description: row.description,
        environments: [],
      };
      byId.set(row.projectId, project);
    }
    if (row.environmentId && row.environmentName && row.environmentSlug && row.environmentKind) {
      project.environments.push({
        id: row.environmentId,
        name: row.environmentName,
        slug: row.environmentSlug,
        kind: row.environmentKind,
      });
    }
  }

  return [...byId.values()];
}

export async function projectSlugTaken(
  db: Database,
  organizationId: string,
  slug: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.organizationId, organizationId), eq(projects.slug, slug)))
    .limit(1);
  return rows.length > 0;
}

export async function insertProjectWithEnvironments(
  db: Database,
  project: typeof projects.$inferInsert,
  environmentRows: (typeof environments.$inferInsert)[],
): Promise<string> {
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(projects).values(project).returning({ id: projects.id });
    if (!row) throw new Error("The project could not be stored");
    await tx.insert(environments).values(environmentRows);
    return row.id;
  });
}

export async function removeProject(
  db: Database,
  organizationId: string,
  id: string,
): Promise<boolean> {
  const rows = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.organizationId, organizationId)))
    .returning({ id: projects.id });
  return rows.length > 0;
}
