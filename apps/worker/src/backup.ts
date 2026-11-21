import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { decryptSecret } from "@enerthya/core/crypto";
import {
  connectRuntime,
  createAndStart,
  execCapture,
  execInContainer,
  type RuntimeConnection,
  stopAndRemove,
} from "@enerthya/core/runtime";
import { putObject, s3ConfigFromEnv } from "@enerthya/core/s3";
import { getDb, selectBackupJob, updateBackup } from "@enerthya/db";
import tar from "tar-fs";

const BACKUP_DIR = process.env.ENERTHYA_BACKUP_DIR ?? "/data/enerthya/backups";
const READY_TIMEOUT_MS = 90_000;

type Credentials = { username: string; password: string; database: string };

async function waitReady(runtime: RuntimeConnection, containerId: string): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const code = await execInContainer(runtime.client, containerId, [
      "pg_isready",
      "-U",
      "postgres",
    ]).catch(() => 1);
    if (code === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error("The verification server did not accept connections within 90s.");
}

async function tableCount(
  runtime: RuntimeConnection,
  containerId: string,
  database: string,
): Promise<number> {
  const { code, output } = await execCapture(runtime.client, containerId, [
    "psql",
    "-U",
    "postgres",
    "-d",
    database,
    "-tAc",
    "select count(*) from information_schema.tables where table_schema = 'public'",
  ]);
  if (code !== 0) throw new Error(`Counting tables failed: ${output.toString().slice(0, 200)}`);
  return Number.parseInt(output.toString().trim(), 10) || 0;
}

/**
 * Dumps a managed database and then **restores it into a throwaway server**,
 * comparing the table count. A dump that was written is not a backup; one that
 * was restored is.
 */
export async function runBackup(backupId: string): Promise<void> {
  const db = getDb();
  const backup = await selectBackupJob(db, backupId);
  if (!backup) return;

  await updateBackup(db, backupId, { status: "running", startedAt: new Date() });

  const runtime = await connectRuntime().catch(() => null);
  if (!runtime) throw new Error("No container runtime answered.");

  const credentials = JSON.parse(decryptSecret(backup.credentialsEncrypted)) as Credentials;
  let verificationId: string | null = null;
  let dumpPath: string | null = null;

  try {
    const [source] = await runtime.client.listContainers({
      filters: { label: [`enerthya.database=${backup.databaseId}`] },
    });
    if (!source) throw new Error("The database container is not running.");

    const dump = await execCapture(runtime.client, source.Id, [
      "pg_dump",
      "-U",
      credentials.username,
      "-Fc",
      "-d",
      credentials.database,
    ]);
    if (dump.code !== 0) {
      throw new Error(`pg_dump failed: ${dump.output.toString().slice(-300)}`);
    }

    const checksum = createHash("sha256").update(dump.output).digest("hex");
    await mkdir(BACKUP_DIR, { recursive: true });
    dumpPath = join(BACKUP_DIR, `${backupId}.dump`);
    await writeFile(dumpPath, dump.output);

    const sourceTables = await tableCount(runtime, source.Id, credentials.database);

    // A second server, nothing mounted, no published port: if the dump is
    // broken this is where it shows.
    const verification = await createAndStart(runtime.client, {
      name: `enerthya-verify-${backupId.slice(0, 8)}`,
      image: `postgres:${backup.version}-alpine`,
      containerPort: 5432,
      labels: { "enerthya.managed": "true", "enerthya.verification": backupId },
      env: ["POSTGRES_PASSWORD=verify-only", "POSTGRES_DB=postgres"],
    });
    verificationId = verification.id;
    await waitReady(runtime, verification.id);

    const archive = tar.pack(BACKUP_DIR, {
      entries: [`${backupId}.dump`],
    });
    await runtime.client.getContainer(verification.id).putArchive(archive, { path: "/tmp" });

    const remote = `/tmp/${backupId}.dump`;
    const created = await execInContainer(runtime.client, verification.id, [
      "createdb",
      "-U",
      "postgres",
      "verify",
    ]);
    if (created !== 0) throw new Error("The verification server refused to create a database.");

    const restored = await execCapture(runtime.client, verification.id, [
      "pg_restore",
      "-U",
      "postgres",
      "-d",
      "verify",
      "--no-owner",
      "--no-acl",
      remote,
    ]);
    if (restored.code !== 0) {
      throw new Error(`pg_restore failed: ${restored.output.toString().slice(-300)}`);
    }

    const restoredTables = await tableCount(runtime, verification.id, "verify");
    if (restoredTables !== sourceTables) {
      throw new Error(
        `Restore verification failed: the source has ${sourceTables} tables, the restored copy has ${restoredTables}.`,
      );
    }

    // The dump is only worth keeping where losing this host cannot take it.
    // With a bucket configured it is uploaded and the local copy removed;
    // without one it stays here, and the row says so.
    const s3 = s3ConfigFromEnv();
    let storagePath = dumpPath;
    let destination: "local" | "s3" = "local";
    if (s3) {
      const key = `backups/${backup.databaseId}/${backupId}.dump`;
      await putObject(s3, key, dump.output);
      storagePath = `s3://${s3.bucket}/${key}`;
      destination = "s3";
      await rm(dumpPath, { force: true }).catch(() => undefined);
      dumpPath = null;
    }

    await updateBackup(db, backupId, {
      status: "succeeded",
      destination,
      storagePath,
      sizeBytes: dump.output.length,
      verifiedAt: new Date(),
      finishedAt: new Date(),
      error: `sha256 ${checksum}; ${restoredTables} tables restored`,
    });
  } catch (error) {
    // A dump that could not be restored is not a backup; do not keep it.
    if (dumpPath) await rm(dumpPath, { force: true }).catch(() => undefined);
    await updateBackup(db, backupId, {
      status: "failed",
      finishedAt: new Date(),
      error: error instanceof Error ? error.message : "The backup failed.",
    });
    throw error;
  } finally {
    if (verificationId) await stopAndRemove(runtime.client, verificationId).catch(() => undefined);
  }
}
