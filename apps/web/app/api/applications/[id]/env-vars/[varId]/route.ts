import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";
import { removeEnvVar } from "@/lib/env-vars";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; varId: string }> },
) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json(
      { error: "Your role cannot change environment variables" },
      { status: 403 },
    );
  }

  const { id, varId } = await params;
  const removed = await removeEnvVar(context.organization.id, id, varId);
  if (!removed) return Response.json({ error: "Variable not found" }, { status: 404 });

  return new Response(null, { status: 204 });
}
