import { roleAtLeast } from "@enerthya/core/roles";
import { getDb, notifyChannel } from "@enerthya/db";
import { currentOrganization } from "@/lib/current-org";
import { removeDomain } from "@/lib/domains";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; domainId: string }> },
) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot remove domains" }, { status: 403 });
  }

  const { id, domainId } = await params;
  const removed = await removeDomain(context.organization.id, id, domainId);
  if (!removed) return Response.json({ error: "Domain not found" }, { status: 404 });

  // Without this the removed host keeps being served until the next deploy.
  await notifyChannel(getDb(), "proxy_publish", "{}").catch(() => undefined);
  return new Response(null, { status: 204 });
}
