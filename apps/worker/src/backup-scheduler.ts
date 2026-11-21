/**
 * Scheduled backups and retention.
 *
 * The scheduler is a plain interval in the worker rather than a BullMQ repeat
 * job: the work it does is "look at the databases and enqueue what is due",
 * which is cheap, idempotent and easy to reason about if the panel and the
 * worker disagree about the clock.
 */
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import {
  deleteObject,
  isBackupDue,
  retentionCutoff,
  s3ConfigFromEnv,
  selectExpiredBackups,
} from "@enerthya/core";
import { enqueueBackupJob } from "@enerthya/core/queue";
import {
  deleteBackupRecord,
  getDb,
  insertBackup,
  markBackupEnqueued,
  selectBackupsCreatedBefore,
  selectNewestSuccessfulBackupId,
  selectScheduledDatabases,
} from "@enerthya/db";
import { logger } from "./log";

const SWEEP_INTERVAL_MS = 5 * 60_000;

/** Turns a stored `s3://bucket/key` path back into the key the bucket knows. */
export function keyFromStoragePath(storagePath: string): string {
  return storagePath.replace(/^s3:\/\/[^/]+\//, "");
}

/**
 * Enqueues one backup for every scheduled database whose interval has elapsed.
 * Returns the ids created, so the caller can log them.
 */
export async function enqueueDueBackups(redisUrl: string, now = new Date()): Promise<string[]> {
  const db = getDb();
  const scheduled = await selectScheduledDatabases(db);
  const created: string[] = [];

  for (const row of scheduled) {
    const due = isBackupDue(
      { intervalHours: row.intervalHours, lastBackupAt: row.lastBackupAt },
      now,
    );
    if (!due) continue;

    const id = randomUUID();
    await insertBackup(db, row.id, id);
    await enqueueBackupJob(redisUrl, id);
    // Recorded when enqueued, not when finished: a backup that fails still
    // waits a full interval instead of being retried on every sweep.
    await markBackupEnqueued(db, row.id, now);
    created.push(id);
  }

  return created;
}

/**
 * Removes successful backups outside the retention window, oldest first, and
 * never the newest successful one. Returns how many rows were removed.
 */
export async function applyRetention(now = new Date()): Promise<number> {
  const db = getDb();
  const scheduled = await selectScheduledDatabases(db);
  const s3 = s3ConfigFromEnv();
  let removed = 0;

  for (const row of scheduled) {
    const cutoff = retentionCutoff(row.retentionDays, now);
    if (!cutoff) continue;

    const newest = await selectNewestSuccessfulBackupId(db, row.id);
    const candidates = await selectBackupsCreatedBefore(db, row.id, cutoff);
    for (const backup of selectExpiredBackups(candidates, cutoff, newest)) {
      try {
        if (backup.destination === "s3" && backup.storagePath && s3) {
          await deleteObject(s3, keyFromStoragePath(backup.storagePath));
        } else if (backup.storagePath) {
          await rm(backup.storagePath, { force: true });
        }
        await deleteBackupRecord(db, backup.id);
        removed += 1;
      } catch (error) {
        // A file that cannot be deleted is not worth stopping the sweep for;
        // the row stays so the next run tries again.
        logger.warn({ backupId: backup.id, err: (error as Error).message }, "retention failed");
      }
    }
  }

  return removed;
}

export function startBackupScheduler(redisUrl: string, intervalMs = SWEEP_INTERVAL_MS): () => void {
  let running = false;

  const sweep = async () => {
    // A slow sweep must not overlap with the next tick.
    if (running) return;
    running = true;
    try {
      const created = await enqueueDueBackups(redisUrl);
      if (created.length > 0) logger.info({ count: created.length }, "backups enqueued");
      const removed = await applyRetention();
      if (removed > 0) logger.info({ count: removed }, "backups removed by retention");
    } catch (error) {
      logger.error({ err: (error as Error).message }, "sweep failed");
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => void sweep(), intervalMs);
  timer.unref();
  void sweep();
  return () => clearInterval(timer);
}
