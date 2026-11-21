/**
 * Backup scheduling and retention arithmetic, kept free of the database and the
 * runtime so the edge cases (no schedule, first run, clock skew, retention off)
 * can be tested directly.
 */

export type BackupSchedule = {
  /** Hours between backups; null means the database is not scheduled. */
  intervalHours: number | null;
  /** When a backup was last enqueued for this database. */
  lastBackupAt: Date | null;
};

/**
 * True when the database is due for another backup. A database with no
 * interval is never due; one that has never run is due immediately.
 */
export function isBackupDue(schedule: BackupSchedule, now: Date): boolean {
  if (schedule.intervalHours === null || schedule.intervalHours <= 0) return false;
  if (schedule.lastBackupAt === null) return true;
  const dueAt = schedule.lastBackupAt.getTime() + schedule.intervalHours * 3_600_000;
  return now.getTime() >= dueAt;
}

/**
 * When the next backup is expected, for display. Null when nothing is scheduled.
 */
export function nextBackupAt(schedule: BackupSchedule): Date | null {
  if (schedule.intervalHours === null || schedule.intervalHours <= 0) return null;
  const base = schedule.lastBackupAt?.getTime() ?? Date.now();
  return new Date(base + schedule.intervalHours * 3_600_000);
}

/**
 * Backups created before this instant are outside the retention window.
 * A null or non-positive retention means "keep everything".
 */
export function retentionCutoff(retentionDays: number | null, now: Date): Date | null {
  if (retentionDays === null || retentionDays <= 0) return null;
  return new Date(now.getTime() - retentionDays * 86_400_000);
}

/**
 * The backups retention should remove: created before the cutoff. The newest
 * successful backup is never returned, so a mistake in the retention window
 * cannot leave a database with nothing to restore from.
 */
export function selectExpiredBackups<T extends { id: string; createdAt: Date }>(
  rows: T[],
  cutoff: Date | null,
  newestSuccessfulId: string | null,
): T[] {
  if (cutoff === null) return [];
  return rows.filter(
    (row) => row.createdAt.getTime() < cutoff.getTime() && row.id !== newestSuccessfulId,
  );
}
