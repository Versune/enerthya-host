import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";
import { createProject, listProjects } from "@/lib/projects";
import { projectSchema } from "@/lib/validation/project";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });

  return Response.json({ projects: await listProjects(context.organization.id) });
}

export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot create projects" }, { status: 403 });
  }

  const parsed = projectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Check the values and try again." },
      { status: 400 },
    );
  }

  try {
    const id = await createProject({
      organizationId: context.organization.id,
      name: parsed.data.name,
      description: parsed.data.description || undefined,
    });
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The project could not be stored" },
      { status: 503 },
    );
  }
}
