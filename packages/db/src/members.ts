import { and, eq } from "drizzle-orm";
import type { Database } from "./client";
import { invitations, members, organizations } from "./schema";

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

export type InvitationView = {
  id: string;
  email: string;
  role: Role;
  status: string;
  expiresAt: Date;
  organizationName: string;
};

/**
 * One invitation by id, without a session: the person it was sent to may not
 * have an account yet, which is exactly who needs to read it.
 */
export async function selectInvitation(
  db: Database,
  invitationId: string,
): Promise<InvitationView | null> {
  const [row] = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      status: invitations.status,
      expiresAt: invitations.expiresAt,
      organizationName: organizations.name,
    })
    .from(invitations)
    .innerJoin(organizations, eq(invitations.organizationId, organizations.id))
    .where(eq(invitations.id, invitationId))
    .limit(1);
  return row ?? null;
}
