import { and, count, eq, gt, sql } from "drizzle-orm";
import type { Database } from "./client";
import { invitations, users } from "./schema";

/** How many accounts this install has. Zero means nobody has claimed it yet. */
export async function countUsers(db: Database): Promise<number> {
  const [row] = await db.select({ value: count() }).from(users);
  return Number(row?.value ?? 0);
}

/**
 * A pending, unexpired invitation sent to that address. Invitations are the
 * only way to join an install that already has an account.
 */
export async function hasPendingInvitation(db: Database, email: string): Promise<boolean> {
  const [row] = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      and(
        sql`lower(${invitations.email}) = ${email.trim().toLowerCase()}`,
        eq(invitations.status, "pending"),
        gt(invitations.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return Boolean(row);
}
