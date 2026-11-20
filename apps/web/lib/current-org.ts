import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

/** Session plus the active organization, or null. API routes answer 401/403. */
export async function currentOrganization() {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return null;

  const organizations = await getAuth().api.listOrganizations({ headers: requestHeaders });
  const organization =
    organizations.find((org) => org.id === session.session.activeOrganizationId) ??
    organizations[0];

  return organization ? { session, organization } : null;
}
