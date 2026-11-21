import { randomUUID } from "node:crypto";
import { toSlug } from "@enerthya/core/slug";
import {
  type ApplicationSummary,
  applicationSlugTaken,
  environmentBelongsTo,
  getDb,
  insertApplication,
  removeApplication,
  selectApplications,
} from "@enerthya/db";

export type ApplicationRow = ApplicationSummary;

export function listApplications(organizationId: string): Promise<ApplicationRow[]> {
  return selectApplications(getDb(), organizationId);
}

async function uniqueSlug(environmentId: string, name: string): Promise<string> {
  const base = toSlug(name) || "app";
  for (let suffix = 1; suffix <= 20; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    if (!(await applicationSlugTaken(getDb(), environmentId, candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function createApplication(
  organizationId: string,
  input: {
    name: string;
    environmentId: string;
    sourceType: "git" | "image";
    gitUrl?: string;
    dockerImage?: string;
    gitBranch: string;
    buildType: "dockerfile" | "nixpacks" | "docker-compose";
    port: number;
    healthcheckPath: string;
  },
): Promise<string> {
  const db = getDb();
  if (!(await environmentBelongsTo(db, organizationId, input.environmentId))) {
    throw new Error("That environment is not part of this organization");
  }

  return insertApplication(db, {
    id: randomUUID(),
    environmentId: input.environmentId,
    name: input.name,
    slug: await uniqueSlug(input.environmentId, input.name),
    sourceType: input.sourceType,
    gitUrl: input.sourceType === "git" ? (input.gitUrl ?? null) : null,
    gitBranch: input.gitBranch,
    dockerImage: input.sourceType === "image" ? (input.dockerImage ?? null) : null,
    buildType: input.buildType,
    port: input.port,
    healthcheckPath: input.healthcheckPath,
  });
}

export function deleteApplication(organizationId: string, id: string): Promise<boolean> {
  return removeApplication(getDb(), organizationId, id);
}
