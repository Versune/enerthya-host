import { requireAdmin } from "@/lib/require-admin";
import { deleteServer } from "@/lib/servers";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin("remove a server");
  if (!gate.ok) return gate.response;
  const { context } = gate;

  const { id } = await params;
  const deleted = await deleteServer(context.organization.id, id);
  if (!deleted) return Response.json({ error: "Server not found" }, { status: 404 });

  return new Response(null, { status: 204 });
}
