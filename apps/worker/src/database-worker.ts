import { decryptSecret } from "@enerthya/core/crypto";
import { DATABASE_QUEUE, type DatabaseJob, redisConnection } from "@enerthya/core/queue";
import {
  connectRuntime,
  createAndStart,
  ensureVolume,
  execInContainer,
  type RuntimeConnection,
  removeVolume,
  stopAndRemove,
} from "@enerthya/core/runtime";
import {
  deleteManagedDatabase,
  getDb,
  selectManagedDatabaseForWorker,
  updateManagedDatabase,
} from "@enerthya/db";
import { Worker } from "bullmq";
import { runBackup } from "./backup";

const READY_TIMEOUT_MS = 90_000;

type Credentials = { username: string; password: string; database: string };

function containerName(id: string): string {
  return `enerthya-db-${id.slice(0, 8)}`;
}

/** Polls `pg_isready` until the server accepts connections. */
async function waitForPostgres(runtime: RuntimeConnection, containerId: string): Promise<void> {
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
  throw new Error("Postgres did not accept connections within 90s.");
}

export async function provisionDatabase(databaseId: string): Promise<void> {
  const db = getDb();
  const row = await selectManagedDatabaseForWorker(db, databaseId);
  if (!row) return;

  if (row.engine !== "postgres") {
    await updateManagedDatabase(db, databaseId, { status: "failed" });
    throw new Error(`The ${row.engine} engine is not implemented yet.`);
  }

  const runtime = await connectRuntime();
  if (!runtime) throw new Error("No container runtime answered.");

  const credentials = JSON.parse(decryptSecret(row.credentialsEncrypted)) as Credentials;

  try {
    await ensureVolume(runtime.client, row.volumeName);

    const started = await createAndStart(runtime.client, {
      name: containerName(databaseId),
      image: `postgres:${row.version}-alpine`,
      containerPort: 5432,
      labels: {
        "enerthya.managed": "true",
        "enerthya.database": databaseId,
      },
      env: [
        `POSTGRES_USER=${credentials.username}`,
        `POSTGRES_PASSWORD=${credentials.password}`,
        `POSTGRES_DB=${credentials.database}`,
      ],
      volumes: [{ source: row.volumeName, target: "/var/lib/postgresql/data" }],
    });

    await waitForPostgres(runtime, started.id);
    await updateManagedDatabase(db, databaseId, { status: "running", port: started.hostPort });
  } catch (error) {
    await updateManagedDatabase(db, databaseId, { status: "failed" });
    throw error;
  }
}

export async function deprovisionDatabase(
  databaseId: string,
  organizationId: string,
): Promise<void> {
  const db = getDb();
  const row = await selectManagedDatabaseForWorker(db, databaseId);
  if (!row) return;

  // Without a runtime the container may still be running, so keep the row:
  // it is what a retried removal reads to find the container and its volume.
  const runtime = await connectRuntime();
  if (!runtime) throw new Error("No container runtime answered.");

  const containers = await runtime.client.listContainers({
    all: true,
    filters: { label: [`enerthya.database=${databaseId}`] },
  });
  for (const container of containers) await stopAndRemove(runtime.client, container.Id);
  await removeVolume(runtime.client, row.volumeName);

  // Only now is the data store actually gone. Removing an already-missing row
  // keeps a retried job idempotent.
  await deleteManagedDatabase(db, organizationId, databaseId);
}

export function startDatabaseWorker(redisUrl: string): Worker {
  return new Worker(
    DATABASE_QUEUE,
    async (job) => {
      const data = job.data as DatabaseJob;
      if (data.action === "backup") await runBackup(data.backupId);
      else if (data.action === "provision") await provisionDatabase(data.databaseId);
      else await deprovisionDatabase(data.databaseId, data.organizationId);
    },
    {
      connection: { ...redisConnection(redisUrl), maxRetriesPerRequest: null },
      concurrency: 1,
    },
  );
}
