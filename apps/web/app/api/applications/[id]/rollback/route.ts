import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";
import { QueueUnavailableError, RollbackUnavailableError, startRollback } from "@/lib/deployments";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot roll back deployments" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const deploymentId = await startRollback(context.organization.id, id);
    return Response.json({ id: deploymentId, status: "queued" }, { status: 202 });
  } catch (error) {
    if (error instanceof RollbackUnavailableError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof QueueUnavailableError) {
      return Response.json(
        { error: `The queue is unreachable, so the rollback was not queued. ${error.message}` },
        { status: 503 },
      );
    }
    if (error instanceof Error && error.message === "Application not found") {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }
    throw error;
  }
}
