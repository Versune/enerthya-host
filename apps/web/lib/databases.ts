import { randomBytes, randomUUID } from "node:crypto";
import { decryptSecret, encryptSecret } from "@enerthya/core/crypto";
import { enqueueBackupJob, enqueueDatabaseJob } from "@enerthya/core/queue";
import {
  type BackupSummary,
  deleteManagedDatabase,
  environmentInOrganization,
  getDb,
  insertBackup,
  insertManagedDatabase,
  type ManagedDatabaseSummary,
  managedDatabaseInOrganization,
  selectBackups,
  selectManagedDatabaseCredentials,
  selectManagedDatabases,
  setBackupSchedule,
} from "@enerthya/db";

export type DatabaseRow = ManagedDatabaseSummary;

export class QueueUnavailableError extends Error {}

export function listManagedDatabases(organizationId: string): Promise<DatabaseRow[]> {
  return selectManagedDatabases(getDb(), organizationId);
}

/** The connection string an operator copies; only admins ever see it. */
export async function connectionString(
  organizationId: string,
  database: DatabaseRow,
): Promise<string | null> {
  if (database.status !== "running" || !database.port) return null;
  const row = await selectManagedDatabaseCredentials(getDb(), organizationId, database.id);
  if (!row) return null;
  const credentials = JSON.parse(decryptSecret(row.credentialsEncrypted)) as {
    username: string;
    password: string;
    database: string;
  };
  const password = encodeURIComponent(credentials.password);
  return `postgres://${credentials.username}:${password}@127.0.0.1:${database.port}/${credentials.database}`;
}

/** Turns a database's automatic backups on (interval set) or off (null). */
export async function setDatabaseSchedule(
  organizationId: string,
  databaseId: string,
  input: { intervalHours: number | null; retentionDays: number | null },
): Promise<void> {
  const db = getDb();
  if (!(await managedDatabaseInOrganization(db, organizationId, databaseId))) {
    throw new Error("Database not found");
  }
  await setBackupSchedule(db, databaseId, {
    intervalHours: input.intervalHours && input.intervalHours > 0 ? input.intervalHours : null,
    retentionDays: input.retentionDays && input.retentionDays > 0 ? input.retentionDays : null,
  });
}

export async function createManagedDatabase(
  organizationId: string,
  input: { name: string; environmentId: string; version: "17" | "16" },
): Promise<string> {
  const db = getDb();
  if (!(await environmentInOrganization(db, organizationId, input.environmentId))) {
    throw new Error("Environment not found");
  }

  const id = randomUUID();
  const credentials = {
    username: "postgres",
    password: randomBytes(24).toString("base64url"),
    database: input.name.replace(/-/g, "_"),
  };

  await insertManagedDatabase(db, {
    id,
    environmentId: input.environmentId,
    name: input.name,
    engine: "postgres",
    version: input.version,
    port: 0,
    volumeName: `enerthya-db-${id.slice(0, 8)}`,
    credentialsEncrypted: encryptSecret(JSON.stringify(credentials)),
  });

  const redisUrl = process.env.REDIS_URL;
  try {
    if (!redisUrl) throw new Error("REDIS_URL is not set in the panel's environment.");
    await enqueueDatabaseJob(redisUrl, id, "provision");
  } catch (error) {
    throw new QueueUnavailableError(
      error instanceof Error ? error.message : "The queue is unreachable.",
    );
  }

  return id;
}

export async function removeManagedDatabase(organizationId: string, id: string): Promise<boolean> {
  const db = getDb();
  const rows = await selectManagedDatabases(db, organizationId);
  if (!rows.some((row) => row.id === id)) return false;

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) await enqueueDatabaseJob(redisUrl, id, "remove").catch(() => undefined);
  return deleteManagedDatabase(db, organizationId, id);
}

export type BackupRow = BackupSummary;

export function listBackups(organizationId: string): Promise<BackupRow[]> {
  return selectBackups(getDb(), organizationId);
}

/** Queues a dump; the worker verifies it by restoring it before it counts. */
export async function createBackup(organizationId: string, databaseId: string): Promise<string> {
  const db = getDb();
  if (!(await managedDatabaseInOrganization(db, organizationId, databaseId))) {
    throw new Error("Database not found");
  }

  const id = randomUUID();
  await insertBackup(db, databaseId, id);

  const redisUrl = process.env.REDIS_URL;
  try {
    if (!redisUrl) throw new Error("REDIS_URL is not set in the panel's environment.");
    await enqueueBackupJob(redisUrl, id);
  } catch (error) {
    throw new QueueUnavailableError(
      error instanceof Error ? error.message : "The queue is unreachable.",
    );
  }
  return id;
}
