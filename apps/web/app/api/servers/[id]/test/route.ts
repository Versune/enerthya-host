import { requireAdmin } from "@/lib/require-admin";
import { testServer } from "@/lib/servers";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  // The probe opens an outbound SSH connection to a host the caller chose.
  const gate = await requireAdmin("test a server");
  if (!gate.ok) return gate.response;
  const { context } = gate;

  const { id } = await params;
  try {
    const result = await testServer(context.organization.id, id);
    if (!result) return Response.json({ error: "Server not found" }, { status: 404 });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The probe failed" },
      { status: 503 },
    );
  }
}
