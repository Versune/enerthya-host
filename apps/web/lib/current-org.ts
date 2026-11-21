import { getDb, getMemberRole, type Role } from "@enerthya/db";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

/**
 * Session, active organization and the caller's role in it. Returns null when
 * any of the three is missing: a session without a membership cannot act.
 */
export async function currentOrganization(): Promise<{
  session: Awaited<ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>>;
  organization: { id: string; name: string; slug: string };
  role: Role;
} | null> {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return null;

  const organizations = await getAuth().api.listOrganizations({ headers: requestHeaders });
  const organization =
    organizations.find((org) => org.id === session.session.activeOrganizationId) ??
    organizations[0];
  if (!organization) return null;

  const role = await getMemberRole(getDb(), organization.id, session.user.id);
  if (!role) return null;

  return { session, organization, role };
}
