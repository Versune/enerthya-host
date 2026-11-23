import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";

type OrgContext = NonNullable<Awaited<ReturnType<typeof currentOrganization>>>;

export type AdminGate = { ok: true; context: OrgContext } | { ok: false; response: Response };

/**
 * The panel's write rule in one place: owner and admin act, member reads.
 * Every handler that changes something calls this before touching the body,
 * so a route cannot be added with the session check and forget the role.
 */
export async function requireAdmin(action: string): Promise<AdminGate> {
  const context = await currentOrganization();
  if (!context) {
    return { ok: false, response: Response.json({ error: "Not signed in" }, { status: 401 }) };
  }
  if (!roleAtLeast(context.role, "admin")) {
    return {
      ok: false,
      response: Response.json({ error: `Your role cannot ${action}` }, { status: 403 }),
    };
  }
  return { ok: true, context };
}
