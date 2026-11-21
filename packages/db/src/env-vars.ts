import { and, eq } from "drizzle-orm";
import type { Database } from "./client";
import { applicationInOrganization } from "./deployments";
import { environmentVariables } from "./schema";

/** What the panel may show: the key and when it applies, never the value. */
export type EnvVarSummary = {
  id: string;
  key: string;
  isBuildTime: boolean;
  updatedAt: Date;
};

export async function selectEnvVars(
  db: Database,
  organizationId: string,
  applicationId: string,
): Promise<EnvVarSummary[]> {
  if (!(await applicationInOrganization(db, organizationId, applicationId))) return [];
  return db
    .select({
      id: environmentVariables.id,
      key: environmentVariables.key,
      isBuildTime: environmentVariables.isBuildTime,
      updatedAt: environmentVariables.updatedAt,
    })
    .from(environmentVariables)
    .where(eq(environmentVariables.applicationId, applicationId))
    .orderBy(environmentVariables.key);
}

/**
 * Writes a variable, or replaces the value of an existing key. The caller
 * encrypts; nothing here ever sees plaintext.
 */
export async function upsertEnvVar(
  db: Database,
  input: {
    id: string;
    applicationId: string;
    key: string;
    valueEncrypted: string;
    isBuildTime: boolean;
  },
): Promise<void> {
  await db
    .insert(environmentVariables)
    .values(input)
    .onConflictDoUpdate({
      target: [environmentVariables.applicationId, environmentVariables.key],
      set: {
        valueEncrypted: input.valueEncrypted,
        isBuildTime: input.isBuildTime,
        updatedAt: new Date(),
      },
    });
}

export async function deleteEnvVar(
  db: Database,
  organizationId: string,
  applicationId: string,
  id: string,
): Promise<boolean> {
  if (!(await applicationInOrganization(db, organizationId, applicationId))) return false;
  const rows = await db
    .delete(environmentVariables)
    .where(
      and(eq(environmentVariables.id, id), eq(environmentVariables.applicationId, applicationId)),
    )
    .returning({ id: environmentVariables.id });
  return rows.length > 0;
}

/** The worker's view: ciphertext plus the build-time flag it has to split on. */
export async function selectEncryptedEnvVars(
  db: Database,
  applicationId: string,
): Promise<{ key: string; valueEncrypted: string; isBuildTime: boolean }[]> {
  return db
    .select({
      key: environmentVariables.key,
      valueEncrypted: environmentVariables.valueEncrypted,
      isBuildTime: environmentVariables.isBuildTime,
    })
    .from(environmentVariables)
    .where(eq(environmentVariables.applicationId, applicationId))
    .orderBy(environmentVariables.key);
}
