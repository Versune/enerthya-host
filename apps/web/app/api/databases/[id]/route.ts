import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";
import { removeManagedDatabase } from "@/lib/databases";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot remove databases" }, { status: 403 });
  }

  const { id } = await params;
  const removed = await removeManagedDatabase(context.organization.id, id);
  if (!removed) return Response.json({ error: "Database not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
