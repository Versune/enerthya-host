import { randomBytes, randomUUID } from "node:crypto";
import { decryptSecret, encryptSecret } from "@enerthya/core/crypto";
import { generateDeployKey, publicKeyFromPrivate } from "@enerthya/core/deploy-key";
import { toSlug } from "@enerthya/core/slug";
import {
  type ApplicationSummary,
  applicationInOrganization,
  applicationSlugTaken,
  type DeployHook,
  environmentBelongsTo,
  getDb,
  insertApplication,
  removeApplication,
  selectApplication,
  selectApplications,
  selectDeployHook,
  setWebhookSecret,
} from "@enerthya/db";

export type ApplicationRow = ApplicationSummary;

export function listApplications(organizationId: string): Promise<ApplicationRow[]> {
  return selectApplications(getDb(), organizationId);
}

export function getApplication(
  organizationId: string,
  applicationId: string,
): Promise<ApplicationRow | null> {
  return selectApplication(getDb(), organizationId, applicationId);
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
    kind: "web" | "service";
    volumes: { source: string; target: string }[];
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
    kind: input.kind,
    volumes: input.volumes.length > 0 ? input.volumes : null,
    gitUrl: input.sourceType === "git" ? (input.gitUrl ?? null) : null,
    gitBranch: input.gitBranch,
    dockerImage: input.sourceType === "image" ? (input.dockerImage ?? null) : null,
    buildType: input.buildType,
    port: input.port,
    healthcheckPath: input.healthcheckPath,
    webhookSecret: null,
    webhookSecretEncrypted: encryptSecret(randomBytes(32).toString("hex")),
    deployKeyEncrypted:
      input.sourceType === "git" ? encryptSecret(generateDeployKey().privateKey) : null,
  });
}

export function deleteApplication(organizationId: string, id: string): Promise<boolean> {
  return removeApplication(getDb(), organizationId, id);
}

/** The webhook settings for one application, after proving it belongs to the org. */
/** The public half of the application's deploy key, for pasting into GitHub. */
export async function getDeployKeyPublic(
  organizationId: string,
  applicationId: string,
): Promise<string | null> {
  const db = getDb();
  if (!(await applicationInOrganization(db, organizationId, applicationId))) return null;
  const hook = await selectDeployHook(db, applicationId);
  if (!hook?.deployKeyEncrypted) return null;
  return publicKeyFromPrivate(decryptSecret(hook.deployKeyEncrypted), hook.name);
}

export async function getDeployHook(
  organizationId: string,
  applicationId: string,
): Promise<DeployHook | null> {
  const db = getDb();
  if (!(await applicationInOrganization(db, organizationId, applicationId))) return null;
  return selectDeployHook(db, applicationId);
}

/**
 * The secret the webhook verifier needs. A row created before the column was
 * encrypted still holds plaintext: the first read enciphers it in place and
 * clears the old column, so the plaintext stops being readable at rest.
 */
export async function webhookSecretFor(hook: DeployHook): Promise<string | null> {
  if (hook.webhookSecretEncrypted) return decryptSecret(hook.webhookSecretEncrypted);
  if (!hook.webhookSecret) return null;
  await setWebhookSecret(getDb(), hook.id, encryptSecret(hook.webhookSecret));
  return hook.webhookSecret;
}

/** Replaces the secret. The old one stops verifying immediately. */
export async function rotateWebhookSecret(
  organizationId: string,
  applicationId: string,
): Promise<string | null> {
  const db = getDb();
  if (!(await applicationInOrganization(db, organizationId, applicationId))) return null;
  const secret = randomBytes(32).toString("hex");
  await setWebhookSecret(db, applicationId, encryptSecret(secret));
  return secret;
}
