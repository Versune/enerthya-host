import { and, desc, eq, isNotNull, lt } from "drizzle-orm";
import type { Database } from "./client";
import { backups, databases, environments, projects } from "./schema";

export type BackupSummary = {
  id: string;
  databaseId: string;
  status: (typeof backups.$inferSelect)["status"];
  destination: (typeof backups.$inferSelect)["destination"];
  sizeBytes: number | null;
  verifiedAt: Date | null;
  error: string | null;
  createdAt: Date;
};

export type BackupJobRow = {
  id: string;
  databaseId: string;
  databaseName: string;
  engine: (typeof databases.$inferSelect)["engine"];
  version: string;
  volumeName: string;
  credentialsEncrypted: string;
};

/** The newest backups for every database of one organization. */
export async function selectBackups(
  db: Database,
  organizationId: string,
  limit = 20,
): Promise<BackupSummary[]> {
  return db
    .select({
      id: backups.id,
      databaseId: backups.databaseId,
      status: backups.status,
      destination: backups.destination,
      sizeBytes: backups.sizeBytes,
      verifiedAt: backups.verifiedAt,
      error: backups.error,
      createdAt: backups.createdAt,
    })
    .from(backups)
    .innerJoin(databases, eq(backups.databaseId, databases.id))
    .innerJoin(environments, eq(databases.environmentId, environments.id))
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(eq(projects.organizationId, organizationId))
    .orderBy(desc(backups.createdAt))
    .limit(limit);
}

export async function insertBackup(db: Database, databaseId: string, id: string): Promise<void> {
  await db.insert(backups).values({ id, databaseId, destination: "local" });
}

export async function updateBackup(
  db: Database,
  id: string,
  patch: {
    status?: BackupSummary["status"];
    destination?: BackupSummary["destination"];
    storagePath?: string;
    sizeBytes?: number;
    verifiedAt?: Date;
    error?: string;
    startedAt?: Date;
    finishedAt?: Date;
  },
): Promise<void> {
  await db.update(backups).set(patch).where(eq(backups.id, id));
}

export async function selectBackupJob(
  db: Database,
  backupId: string,
): Promise<BackupJobRow | null> {
  const [row] = await db
    .select({
      id: backups.id,
      databaseId: databases.id,
      databaseName: databases.name,
      engine: databases.engine,
      version: databases.version,
      volumeName: databases.volumeName,
      credentialsEncrypted: databases.credentialsEncrypted,
    })
    .from(backups)
    .innerJoin(databases, eq(backups.databaseId, databases.id))
    .where(eq(backups.id, backupId))
    .limit(1);
  return row ?? null;
}

/** True when the database belongs to an organization (for the panel). */
export async function managedDatabaseInOrganization(
  db: Database,
  organizationId: string,
  databaseId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: databases.id })
    .from(databases)
    .innerJoin(environments, eq(databases.environmentId, environments.id))
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(and(eq(databases.id, databaseId), eq(projects.organizationId, organizationId)))
    .limit(1);
  return Boolean(row);
}

export type ScheduledDatabase = {
  id: string;
  name: string;
  intervalHours: number | null;
  retentionDays: number | null;
  lastBackupAt: Date | null;
};

/**
 * Databases that want automatic backups. The worker decides which are due with
 * `isBackupDue`, so the query stays a plain read.
 */
export async function selectScheduledDatabases(db: Database): Promise<ScheduledDatabase[]> {
  return db
    .select({
      id: databases.id,
      name: databases.name,
      intervalHours: databases.backupIntervalHours,
      retentionDays: databases.backupRetentionDays,
      lastBackupAt: databases.lastBackupAt,
    })
    .from(databases)
    .where(and(eq(databases.status, "running"), isNotNull(databases.backupIntervalHours)));
}

export async function setBackupSchedule(
  db: Database,
  databaseId: string,
  patch: { intervalHours: number | null; retentionDays: number | null },
): Promise<void> {
  await db
    .update(databases)
    .set({
      backupIntervalHours: patch.intervalHours,
      backupRetentionDays: patch.retentionDays,
      updatedAt: new Date(),
    })
    .where(eq(databases.id, databaseId));
}

/** Records that a backup was enqueued, so the next run waits a full interval. */
export async function markBackupEnqueued(
  db: Database,
  databaseId: string,
  at: Date,
): Promise<void> {
  await db
    .update(databases)
    .set({ lastBackupAt: at, updatedAt: at })
    .where(eq(databases.id, databaseId));
}

export type BackupFileRow = {
  id: string;
  createdAt: Date;
  destination: (typeof backups.$inferSelect)["destination"];
  storagePath: string | null;
};

/** Successful backups of one database older than the cutoff, newest first. */
export async function selectBackupsCreatedBefore(
  db: Database,
  databaseId: string,
  cutoff: Date,
): Promise<BackupFileRow[]> {
  return db
    .select({
      id: backups.id,
      createdAt: backups.createdAt,
      destination: backups.destination,
      storagePath: backups.storagePath,
    })
    .from(backups)
    .where(
      and(
        eq(backups.databaseId, databaseId),
        eq(backups.status, "succeeded"),
        lt(backups.createdAt, cutoff),
      ),
    )
    .orderBy(desc(backups.createdAt));
}

export async function selectNewestSuccessfulBackupId(
  db: Database,
  databaseId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: backups.id })
    .from(backups)
    .where(and(eq(backups.databaseId, databaseId), eq(backups.status, "succeeded")))
    .orderBy(desc(backups.createdAt))
    .limit(1);
  return row?.id ?? null;
}

export async function deleteBackupRecord(db: Database, id: string): Promise<void> {
  await db.delete(backups).where(eq(backups.id, id));
}
