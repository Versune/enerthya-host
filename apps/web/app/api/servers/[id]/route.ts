import { currentOrganization } from "@/lib/current-org";
import { deleteServer } from "@/lib/servers";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const deleted = await deleteServer(context.organization.id, id);
  if (!deleted) return Response.json({ error: "Server not found" }, { status: 404 });

  return new Response(null, { status: 204 });
}
