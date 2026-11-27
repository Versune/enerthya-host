/**
 * The worker owns everything that outlives a request: builds, deploys, health
 * checks, backups, metrics collection and cron. The panel enqueues work and
 * reads state; it never builds or deploys inside a route handler.
 *
 * Today it consumes the deployment queue and resolves the source of each
 * deployment. The container runtime lands in the next slice; until then every
 * deployment stops with an explicit failure rather than claiming success.
 */

import {
  DEPLOY_QUEUE,
  type DeployJob,
  enqueueDeployment,
  redisConnection,
} from "@enerthya/core/queue";
import { getDb, selectInFlightDeployments } from "@enerthya/db";
import { Worker } from "bullmq";
import { sweepVerificationContainers } from "./backup";
import { startBackupScheduler } from "./backup-scheduler";
import { startDatabaseWorker } from "./database-worker";
import { runDeployment } from "./deploy";
import { startEmailServer } from "./email-server";
import { startHostStatsServer } from "./host-stats-server";
import { logger } from "./log";
import { startLogServer } from "./log-server";
import { startProxyServer } from "./proxy-server";
import { startStatsServer } from "./stats-server";
import { startTerminalServer } from "./terminal-server";

export const WORKER_NAME = "enerthya-worker";

/**
 * A deployment that started and never finished is stranded: the row sits in
 * `building`, `deploying` or `healthcheck` and no job will ever pick it up, so
 * nothing retries and nothing tells the person why. This puts each one back on
 * the queue marked `resume`; the pipeline then continues at its first
 * unfinished step instead of cloning again.
 */
async function reconcileInterruptedDeployments(redisUrl: string): Promise<void> {
  let stranded: string[];
  try {
    stranded = await selectInFlightDeployments(getDb());
  } catch (error) {
    logger.error({ err: error }, "could not look for interrupted deployments");
    return;
  }
  for (const deploymentId of stranded) {
    logger.warn({ deploymentId }, "deployment was interrupted; resuming it");
    await enqueueDeployment(redisUrl, deploymentId, { resume: true }).catch((error: unknown) => {
      logger.error({ deploymentId, err: error }, "could not re-enqueue the interrupted deployment");
    });
  }
}

export function startWorker(redisUrl: string): Worker<DeployJob> {
  const worker = new Worker<DeployJob>(
    DEPLOY_QUEUE,
    async (job) => {
      await runDeployment(job.data.deploymentId, { resume: job.data.resume === true });
    },
    {
      // BullMQ requires a connection that never gives up on a transient error;
      // the block-timeout polling is how it waits for new work.
      connection: { ...redisConnection(redisUrl), maxRetriesPerRequest: null },
      concurrency: 2,
    },
  );

  worker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, err: error.message }, "deployment job failed");
  });
  worker.on("error", (error) => {
    logger.error({ err: error.message }, "queue error");
  });

  return worker;
}

const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
  const worker = startWorker(redisUrl);
  startDatabaseWorker(redisUrl);
  void reconcileInterruptedDeployments(redisUrl);
  logger.info({ queues: [DEPLOY_QUEUE, "databases"] }, "listening");

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    startLogServer(databaseUrl);
    startStatsServer(databaseUrl);
    // A backup killed mid-run leaves its verification server behind, holding
    // a customer dump. Clear those before this process starts new backups.
    void sweepVerificationContainers();
    startBackupScheduler(redisUrl);
    logger.info({ intervalMs: 300_000 }, "backup scheduler running");
    startEmailServer(databaseUrl);
    startHostStatsServer(databaseUrl);
    startTerminalServer(databaseUrl);
    startProxyServer(databaseUrl);
    logger.info("terminal server listening on terminal_start");
  } else
    logger.warn("DATABASE_URL is not set; logs, metrics and backup scheduling are unavailable");

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "closing");
    await worker.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
} else {
  logger.error("REDIS_URL is not set; nothing to consume");
  process.exit(1);
}
