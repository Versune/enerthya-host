import { Queue } from "bullmq";

/**
 * BullMQ is the transport between the panel and the worker. Redis holds the
 * queue, never the truth: a deployment's state lives in Postgres and a job is
 * only the request to move it forward.
 */
export const DEPLOY_QUEUE = "deployments";
export const DATABASE_QUEUE = "databases";

export type DeployJob = { deploymentId: string; resume?: boolean };
export type DatabaseJob =
  | { databaseId: string; action: "provision" | "remove"; backupId?: never }
  | { backupId: string; action: "backup"; databaseId?: never };

export type RedisConnection = {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: Record<string, never>;
};

/**
 * BullMQ hands its connection options to ioredis, which wants the parts of a
 * URL rather than the URL itself. Parsing it here keeps the panel and the
 * worker reading one format.
 */
export function redisConnection(redisUrl: string): RedisConnection {
  let url: URL;
  try {
    url = new URL(redisUrl);
  } catch {
    throw new Error(`REDIS_URL is not a URL: ${redisUrl}`);
  }
  if (url.protocol !== "redis:" && url.protocol !== "rediss:") {
    throw new Error(`REDIS_URL must use redis:// or rediss://, not ${url.protocol}`);
  }

  const database = url.pathname.replace(/^\//, "");
  const connection: RedisConnection = {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
  };
  if (url.username) connection.username = decodeURIComponent(url.username);
  if (url.password) connection.password = decodeURIComponent(url.password);
  if (database) {
    const db = Number(database);
    if (!Number.isInteger(db) || db < 0)
      throw new Error(`REDIS_URL has an invalid database: ${database}`);
    connection.db = db;
  }
  if (url.protocol === "rediss:") connection.tls = {};

  return connection;
}

export function deployQueue(redisUrl: string): Queue<DeployJob> {
  return new Queue<DeployJob>(DEPLOY_QUEUE, { connection: redisConnection(redisUrl) });
}

/**
 * Enqueues one deployment. The job id is the deployment id, so a retried
 * request cannot queue the same deployment twice.
 */
export async function enqueueDeployment(
  redisUrl: string,
  deploymentId: string,
  options: { resume?: boolean } = {},
): Promise<void> {
  const queue = deployQueue(redisUrl);
  // A resume is a second job for the same deployment, so it cannot reuse the
  // id: the original job is still in Redis, completed or not.
  const jobId = options.resume ? `${deploymentId}:resume:${Date.now()}` : deploymentId;
  try {
    await queue.add(
      "deploy",
      { deploymentId, ...(options.resume ? { resume: true } : {}) },
      { jobId, attempts: 1, removeOnComplete: 200, removeOnFail: 200 },
    );
  } finally {
    await queue.close();
  }
}

/** Queues a managed database operation. The job id pairs the action with the
 * database, so re-requesting the same action cannot double-provision. */
export async function enqueueDatabaseJob(
  redisUrl: string,
  databaseId: string,
  action: "provision" | "remove",
): Promise<void> {
  await addDatabaseJob(redisUrl, `${action}-${databaseId}`, { databaseId, action });
}

/** Queues one backup; the id pairs the job with the backup row. */
export async function enqueueBackupJob(redisUrl: string, backupId: string): Promise<void> {
  await addDatabaseJob(redisUrl, `backup-${backupId}`, { backupId, action: "backup" });
}

async function addDatabaseJob(redisUrl: string, jobId: string, data: DatabaseJob): Promise<void> {
  const queue = new Queue<DatabaseJob>(DATABASE_QUEUE, { connection: redisConnection(redisUrl) });
  try {
    await queue.add(data.action, data, {
      jobId,
      attempts: 1,
      removeOnComplete: 50,
      removeOnFail: 50,
    });
  } finally {
    await queue.close();
  }
}
