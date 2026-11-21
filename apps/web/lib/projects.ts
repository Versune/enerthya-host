import { randomUUID } from "node:crypto";
import { toSlug } from "@enerthya/core/slug";
import {
  getDb,
  insertProjectWithEnvironments,
  type ProjectSummary,
  projectSlugTaken,
  removeProject,
  selectProjects,
} from "@enerthya/db";

export type ProjectRow = ProjectSummary;

export function listProjects(organizationId: string): Promise<ProjectRow[]> {
  return selectProjects(getDb(), organizationId);
}

async function uniqueSlug(organizationId: string, name: string): Promise<string> {
  const base = toSlug(name) || "project";
  for (let suffix = 1; suffix <= 20; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    if (!(await projectSlugTaken(getDb(), organizationId, candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * A project is born with its two real environments. Creating them later is a
 * separate action; an empty project would be a state nobody asked for.
 */
export async function createProject(input: {
  organizationId: string;
  name: string;
  description?: string;
}): Promise<string> {
  const db = getDb();
  const projectId = randomUUID();

  await insertProjectWithEnvironments(
    db,
    {
      id: projectId,
      organizationId: input.organizationId,
      name: input.name,
      slug: await uniqueSlug(input.organizationId, input.name),
      description: input.description || null,
    },
    [
      {
        id: randomUUID(),
        projectId,
        name: "Production",
        slug: "production",
        kind: "production",
      },
      {
        id: randomUUID(),
        projectId,
        name: "Staging",
        slug: "staging",
        kind: "staging",
      },
    ],
  );

  return projectId;
}

export function deleteProject(organizationId: string, id: string): Promise<boolean> {
  return removeProject(getDb(), organizationId, id);
}
