import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";
import { createManagedDatabase, QueueUnavailableError } from "@/lib/databases";
import { firstIssue } from "@/lib/validation/auth";
import { managedDatabaseSchema } from "@/lib/validation/database";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot create databases" }, { status: 403 });
  }

  const parsed = managedDatabaseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: firstIssue(parsed.error) }, { status: 400 });

  try {
    const id = await createManagedDatabase(context.organization.id, parsed.data);
    return Response.json({ id, status: "provisioning" }, { status: 202 });
  } catch (error) {
    if (error instanceof QueueUnavailableError) {
      return Response.json(
        { error: `The queue is unreachable. ${error.message}` },
        { status: 503 },
      );
    }
    if (error instanceof Error && error.message === "Environment not found") {
      return Response.json({ error: "Environment not found" }, { status: 404 });
    }
    throw error;
  }
}
