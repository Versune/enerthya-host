import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";
import { saveEnvVar } from "@/lib/env-vars";
import { firstIssue } from "@/lib/validation/auth";
import { envVarSchema } from "@/lib/validation/env-var";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json(
      { error: "Your role cannot change environment variables" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = envVarSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const { id } = await params;
  try {
    await saveEnvVar(context.organization.id, id, parsed.data);
    return Response.json({ key: parsed.data.key }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Application not found") {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }
    throw error;
  }
}
