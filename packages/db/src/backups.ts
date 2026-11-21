import { and, desc, eq } from "drizzle-orm";
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
