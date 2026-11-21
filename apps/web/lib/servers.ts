import { randomUUID } from "node:crypto";
import os from "node:os";
import { decryptSecret, encryptSecret, probeServer } from "@enerthya/core";
import {
  findServer,
  getDb,
  hasServers,
  insertServer,
  patchServer,
  removeServer,
  type ServerSummary,
  selectServers,
} from "@enerthya/db";
import { detectRuntimes } from "@/lib/runtime";

export type ServerRow = ServerSummary;

export function listServers(organizationId: string): Promise<ServerRow[]> {
  return selectServers(getDb(), organizationId);
}

/**
 * The machine running the panel is always the first server: it needs no key
 * and no network. Inserted once per organization, never duplicated.
 */
export async function ensureLocalServer(organizationId: string): Promise<void> {
  const db = getDb();
  if (await hasServers(db, organizationId)) return;

  const runtime = await detectRuntimes();
  const recommended = runtime.runtimes.find((entry) => entry.name === runtime.recommended);

  await insertServer(db, {
    id: randomUUID(),
    organizationId,
    name: "This machine",
    host: "127.0.0.1",
    port: 22,
    username: os.userInfo().username,
    isLocal: true,
    status: recommended?.usable ? "ready" : "pending",
    dockerVersion: recommended?.version ?? null,
    lastSeenAt: new Date(),
  });
}

export function createServer(input: {
  organizationId: string;
  name: string;
  host: string;
  port: number;
  username: string;
  privateKey?: string;
}): Promise<ServerRow> {
  return insertServer(getDb(), {
    id: randomUUID(),
    organizationId: input.organizationId,
    name: input.name,
    host: input.host,
    port: input.port,
    username: input.username,
    isLocal: false,
    status: "pending",
    privateKeyEncrypted: input.privateKey ? encryptSecret(input.privateKey) : null,
  });
}

export function deleteServer(organizationId: string, id: string): Promise<boolean> {
  return removeServer(getDb(), organizationId, id);
}

/** Probe and persist the result. The key never leaves this function. */
export async function testServer(organizationId: string, id: string) {
  const db = getDb();
  const row = await findServer(db, organizationId, id);
  if (!row) return null;

  let status: "ready" | "unreachable" = "unreachable";
  let dockerVersion: string | null = null;
  let hostKeyFingerprint = row.hostKeyFingerprint;
  let error: string | undefined;

  if (row.isLocal) {
    const runtime = await detectRuntimes();
    const recommended = runtime.runtimes.find((entry) => entry.name === runtime.recommended);
    status = recommended?.usable ? "ready" : "unreachable";
    dockerVersion = recommended?.version ?? null;
  } else if (row.privateKeyEncrypted) {
    const result = await probeServer({
      host: row.host,
      port: row.port,
      username: row.username,
      privateKey: decryptSecret(row.privateKeyEncrypted),
      expectedHostKey: row.hostKeyFingerprint,
    });

    if (result.ok) {
      status = result.runtime ? "ready" : "unreachable";
      dockerVersion = result.version;
      // Trust on first use: pin what the host presented, and never replace a
      // pinned key from a failed probe.
      hostKeyFingerprint = row.hostKeyFingerprint ?? result.fingerprint;
    } else {
      error = result.error;
    }
  }

  const server = await patchServer(db, row.id, {
    status,
    dockerVersion,
    hostKeyFingerprint,
    lastSeenAt: status === "ready" ? new Date() : row.lastSeenAt,
    updatedAt: new Date(),
  });

  return server ? { server, error } : null;
}

/** Trust the host key again on the next probe; used after a legitimate reinstall. */
export async function forgetHostKey(organizationId: string, id: string) {
  const db = getDb();
  const row = await findServer(db, organizationId, id);
  if (!row) return null;

  return patchServer(db, row.id, {
    hostKeyFingerprint: null,
    status: "pending",
    updatedAt: new Date(),
  });
}
