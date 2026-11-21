/**
 * The worker owns everything that outlives a request: builds, deploys, health
 * checks, backups, metrics collection and cron. The panel enqueues work and
 * reads state; it never builds or deploys inside a route handler.
 *
 * Today it consumes the deployment queue and resolves the source of each
 * deployment. The container runtime lands in the next slice; until then every
 * deployment stops with an explicit failure rather than claiming success.
 */
import { DEPLOY_QUEUE, type DeployJob, redisConnection } from "@enerthya/core/queue";
import { Worker } from "bullmq";
import { runDeployment } from "./deploy";

export const WORKER_NAME = "enerthya-worker";

export function startWorker(redisUrl: string): Worker<DeployJob> {
  const worker = new Worker<DeployJob>(
    DEPLOY_QUEUE,
    async (job) => {
      await runDeployment(job.data.deploymentId);
    },
    {
      // BullMQ requires a connection that never gives up on a transient error;
      // the block-timeout polling is how it waits for new work.
      connection: { ...redisConnection(redisUrl), maxRetriesPerRequest: null },
      concurrency: 2,
    },
  );

  worker.on("failed", (job, error) => {
    console.error(`[${WORKER_NAME}] job ${job?.id ?? "?"} failed: ${error.message}`);
  });
  worker.on("error", (error) => {
    console.error(`[${WORKER_NAME}] ${error.message}`);
  });

  return worker;
}

const redisUrl = process.env.REDIS_URL;
if (redisUrl) {
  const worker = startWorker(redisUrl);
  console.log(`[${WORKER_NAME}] listening on ${DEPLOY_QUEUE}`);

  const shutdown = async (signal: string) => {
    console.log(`[${WORKER_NAME}] ${signal}: closing`);
    await worker.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
} else {
  console.error(`[${WORKER_NAME}] REDIS_URL is not set; nothing to consume.`);
  process.exit(1);
}
