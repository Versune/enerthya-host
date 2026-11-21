import { and, desc, eq } from "drizzle-orm";
import type { Database } from "./client";
import { databases, environments, projects } from "./schema";

export type ManagedDatabaseSummary = {
  id: string;
  name: string;
  engine: (typeof databases.$inferSelect)["engine"];
  version: string;
  port: number;
  status: (typeof databases.$inferSelect)["status"];
  environmentId: string;
  projectName: string;
  environmentSlug: string;
};

export async function selectManagedDatabases(
  db: Database,
  organizationId: string,
): Promise<ManagedDatabaseSummary[]> {
  return db
    .select({
      id: databases.id,
      name: databases.name,
      engine: databases.engine,
      version: databases.version,
      port: databases.port,
      status: databases.status,
      environmentId: databases.environmentId,
      projectName: projects.name,
      environmentSlug: environments.slug,
    })
    .from(databases)
    .innerJoin(environments, eq(databases.environmentId, environments.id))
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(eq(projects.organizationId, organizationId))
    .orderBy(desc(databases.createdAt));
}

export async function environmentInOrganization(
  db: Database,
  organizationId: string,
  environmentId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: environments.id })
    .from(environments)
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(and(eq(environments.id, environmentId), eq(projects.organizationId, organizationId)))
    .limit(1);
  return Boolean(row);
}

export async function insertManagedDatabase(
  db: Database,
  values: typeof databases.$inferInsert,
): Promise<void> {
  await db.insert(databases).values(values);
}

export async function updateManagedDatabase(
  db: Database,
  id: string,
  patch: { status?: ManagedDatabaseSummary["status"]; port?: number },
): Promise<void> {
  await db
    .update(databases)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(databases.id, id));
}

export async function deleteManagedDatabase(
  db: Database,
  organizationId: string,
  id: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: databases.id })
    .from(databases)
    .innerJoin(environments, eq(databases.environmentId, environments.id))
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(and(eq(databases.id, id), eq(projects.organizationId, organizationId)))
    .limit(1);
  if (!row) return false;
  await db.delete(databases).where(eq(databases.id, id));
  return true;
}

export type ManagedDatabaseJobRow = {
  id: string;
  name: string;
  engine: (typeof databases.$inferSelect)["engine"];
  version: string;
  volumeName: string;
  credentialsEncrypted: string;
};

export async function selectManagedDatabaseForWorker(
  db: Database,
  id: string,
): Promise<ManagedDatabaseJobRow | null> {
  const [row] = await db
    .select({
      id: databases.id,
      name: databases.name,
      engine: databases.engine,
      version: databases.version,
      volumeName: databases.volumeName,
      credentialsEncrypted: databases.credentialsEncrypted,
    })
    .from(databases)
    .where(eq(databases.id, id))
    .limit(1);
  return row ?? null;
}

export async function selectManagedDatabaseCredentials(
  db: Database,
  organizationId: string,
  id: string,
): Promise<{ credentialsEncrypted: string } | null> {
  const [row] = await db
    .select({ credentialsEncrypted: databases.credentialsEncrypted })
    .from(databases)
    .innerJoin(environments, eq(databases.environmentId, environments.id))
    .innerJoin(projects, eq(environments.projectId, projects.id))
    .where(and(eq(databases.id, id), eq(projects.organizationId, organizationId)))
    .limit(1);
  return row ?? null;
}
