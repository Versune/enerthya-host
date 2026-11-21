/**
 * One logger for the worker. pino writes one JSON object per line, so the
 * container log keeps the fields (job id, database id, error) instead of a
 * sentence someone has to parse with a regex later.
 *
 * `sync: true` on purpose: stdout inside a container is a pipe, and pino's
 * async destination drops what is buffered when the process receives SIGTERM
 * mid-shutdown. No pretty transport either — it would be a package the bundled
 * worker has to resolve at runtime.
 */
import pino from "pino";

export const logger = pino(
  { name: "enerthya-worker", level: process.env.LOG_LEVEL ?? "info" },
  pino.destination({ dest: 1, sync: true }),
);
