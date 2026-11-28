import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";
import { QueueUnavailableError, removeManagedDatabase } from "@/lib/databases";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot remove databases" }, { status: 403 });
  }

  const { id } = await params;
  let removed: boolean;
  try {
    removed = await removeManagedDatabase(context.organization.id, id);
  } catch (error) {
    if (error instanceof QueueUnavailableError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
  if (!removed) return Response.json({ error: "Database not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
