import { roleAtLeast } from "@enerthya/core/roles";
import { createApplication, listApplications } from "@/lib/applications";
import { currentOrganization } from "@/lib/current-org";
import { applicationSchema } from "@/lib/validation/application";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });

  return Response.json({ applications: await listApplications(context.organization.id) });
}

export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot create applications" }, { status: 403 });
  }

  const parsed = applicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Check the values and try again." },
      { status: 400 },
    );
  }

  try {
    const id = await createApplication(context.organization.id, parsed.data);
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The application could not be stored" },
      { status: 503 },
    );
  }
}
