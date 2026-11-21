import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";
import { createBackup, QueueUnavailableError } from "@/lib/databases";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot run backups" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const backupId = await createBackup(context.organization.id, id);
    return Response.json({ id: backupId, status: "scheduled" }, { status: 202 });
  } catch (error) {
    if (error instanceof QueueUnavailableError) {
      return Response.json(
        { error: `The queue is unreachable. ${error.message}` },
        { status: 503 },
      );
    }
    if (error instanceof Error && error.message === "Database not found") {
      return Response.json({ error: "Database not found" }, { status: 404 });
    }
    throw error;
  }
}
