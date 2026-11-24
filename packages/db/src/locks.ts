import type { Database } from "./client";

/** Milliseconds between attempts while another process holds the lock. */
const RETRY_MS = 2_000;

export type LockOptions = {
  waitMs?: number;
  /** Called once the lock is held, before the work starts. */
  onAcquired?: () => void | Promise<void>;
};

/**
 * Serializes work per application across every worker process.
 *
 * A deployment is a conversation with the runtime and the proxy: two runs of
 * the same application at once stop each other's containers, and a resume can
 * adopt a deployment another worker is still executing.
 */
export async function withApplicationLock<T>(
  db: Database,
  applicationId: string,
  run: () => Promise<T>,
  options: LockOptions = {},
): Promise<{ locked: true; value: T } | { locked: false }> {
  return withAdvisoryLock(db, `application:${applicationId}`, run, options);
}

/**
 * The same lock for any key: a deployment holds one per application, the
 * proxy holds one for the whole route table.
 *
 * The lock is a Postgres advisory lock held on a reserved connection —
 * advisory locks are session-scoped, and a pooled query may land on a
 * different connection. Returns `{ locked: false }` when the wait runs out;
 * the caller decides what that means instead of running anyway.
 */
export async function withAdvisoryLock<T>(
  db: Database,
  key: string,
  run: () => Promise<T>,
  { waitMs = 0, onAcquired }: LockOptions = {},
): Promise<{ locked: true; value: T } | { locked: false }> {
  const sql = await db.$client.reserve();
  try {
    const deadline = Date.now() + waitMs;
    while (true) {
      const [row] = await sql`select pg_try_advisory_lock(hashtext(${key})) as locked`;
      if (row?.locked) break;
      if (Date.now() >= deadline) return { locked: false };
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
    try {
      await onAcquired?.();
      return { locked: true, value: await run() };
    } finally {
      await sql`select pg_advisory_unlock(hashtext(${key}))`;
    }
  } finally {
    sql.release();
  }
}
