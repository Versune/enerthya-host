import { requireAdmin } from "@/lib/require-admin";
import { forgetHostKey } from "@/lib/servers";

export const dynamic = "force-dynamic";

/** Forget a pinned host key after a legitimate rebuild or reinstall. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin("forget a host key");
  if (!gate.ok) return gate.response;
  const { context } = gate;

  const { id } = await params;
  const server = await forgetHostKey(context.organization.id, id);
  if (!server) return Response.json({ error: "Server not found" }, { status: 404 });

  return Response.json({ server });
}
