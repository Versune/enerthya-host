import { randomUUID } from "node:crypto";
import { encryptSecret } from "@enerthya/core/crypto";
import {
  applicationInOrganization,
  deleteEnvVar,
  type EnvVarSummary,
  getDb,
  selectEnvVars,
  upsertEnvVar,
} from "@enerthya/db";

export type EnvVarRow = EnvVarSummary;

export function listEnvVars(organizationId: string, applicationId: string): Promise<EnvVarRow[]> {
  return selectEnvVars(getDb(), organizationId, applicationId);
}

/**
 * Stores one variable. The value is encrypted before it reaches the database
 * and is never read back into the panel — only the worker decrypts it, when it
 * builds and starts a container.
 */
export async function saveEnvVar(
  organizationId: string,
  applicationId: string,
  input: { key: string; value: string; isBuildTime: boolean },
): Promise<void> {
  const db = getDb();
  if (!(await applicationInOrganization(db, organizationId, applicationId))) {
    throw new Error("Application not found");
  }

  await upsertEnvVar(db, {
    id: randomUUID(),
    applicationId,
    key: input.key,
    valueEncrypted: encryptSecret(input.value),
    isBuildTime: input.isBuildTime,
  });
}

export function removeEnvVar(
  organizationId: string,
  applicationId: string,
  id: string,
): Promise<boolean> {
  return deleteEnvVar(getDb(), organizationId, applicationId, id);
}
