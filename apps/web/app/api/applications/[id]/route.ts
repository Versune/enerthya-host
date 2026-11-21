import { roleAtLeast } from "@enerthya/core/roles";
import { deleteApplication } from "@/lib/applications";
import { currentOrganization } from "@/lib/current-org";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot delete applications" }, { status: 403 });
  }

  const { id } = await params;
  const deleted = await deleteApplication(context.organization.id, id);
  if (!deleted) return Response.json({ error: "Application not found" }, { status: 404 });

  return new Response(null, { status: 204 });
}
