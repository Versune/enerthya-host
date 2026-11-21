import { and, eq } from "drizzle-orm";
import type { Database } from "./client";
import { members } from "./schema";

export type Role = "owner" | "admin" | "member";

export async function getMemberRole(
  db: Database,
  organizationId: string,
  userId: string,
): Promise<Role | null> {
  const rows = await db
    .select({ role: members.role })
    .from(members)
    .where(and(eq(members.organizationId, organizationId), eq(members.userId, userId)))
    .limit(1);

  return rows[0]?.role ?? null;
}
