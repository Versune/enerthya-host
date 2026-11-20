import { and, asc, eq } from "drizzle-orm";
import type { Database } from "./client";
import { servers } from "./schema";

/**
 * Server queries live in the db package so the web app never imports
 * drizzle-orm directly: two copies of the ORM produce two incompatible
 * SQL types in a pnpm workspace.
 */

export const SERVER_SUMMARY = {
  id: servers.id,
  name: servers.name,
  host: servers.host,
  port: servers.port,
  username: servers.username,
  isLocal: servers.isLocal,
  status: servers.status,
  dockerVersion: servers.dockerVersion,
  hostKeyFingerprint: servers.hostKeyFingerprint,
  lastSeenAt: servers.lastSeenAt,
};

export type ServerSummary = {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  isLocal: boolean;
  status: "pending" | "ready" | "unreachable";
  dockerVersion: string | null;
  hostKeyFingerprint: string | null;
  lastSeenAt: Date | null;
};

export function selectServers(db: Database, organizationId: string): Promise<ServerSummary[]> {
  return db
    .select(SERVER_SUMMARY)
    .from(servers)
    .where(eq(servers.organizationId, organizationId))
    .orderBy(asc(servers.createdAt));
}

export async function hasServers(db: Database, organizationId: string): Promise<boolean> {
  const rows = await db
    .select({ id: servers.id })
    .from(servers)
    .where(eq(servers.organizationId, organizationId))
    .limit(1);
  return rows.length > 0;
}

export async function insertServer(
  db: Database,
  values: typeof servers.$inferInsert,
): Promise<ServerSummary> {
  const [row] = await db.insert(servers).values(values).returning(SERVER_SUMMARY);
  if (!row) throw new Error("The server could not be stored");
  return row;
}

export async function removeServer(
  db: Database,
  organizationId: string,
  id: string,
): Promise<boolean> {
  const rows = await db
    .delete(servers)
    .where(and(eq(servers.id, id), eq(servers.organizationId, organizationId)))
    .returning({ id: servers.id });
  return rows.length > 0;
}

export function findServer(db: Database, organizationId: string, id: string) {
  return db
    .select()
    .from(servers)
    .where(and(eq(servers.id, id), eq(servers.organizationId, organizationId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export async function patchServer(
  db: Database,
  id: string,
  patch: Partial<typeof servers.$inferInsert>,
): Promise<ServerSummary | null> {
  const [row] = await db
    .update(servers)
    .set(patch)
    .where(eq(servers.id, id))
    .returning(SERVER_SUMMARY);
  return row ?? null;
}
