/**
 * The worker owns everything that outlives a request: builds, deploys, health
 * checks, backups, metrics collection and cron. The panel enqueues work and
 * reads state; it never builds or deploys inside a route handler.
 *
 * Queue wiring arrives with the deployment engine. Until then this process
 * exists so the boundary is enforced from the first commit.
 */
export const WORKER_NAME = "enerthya-worker";
