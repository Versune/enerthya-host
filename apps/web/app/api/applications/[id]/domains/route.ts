import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";
import { addDomain } from "@/lib/domains";
import { firstIssue } from "@/lib/validation/auth";
import { domainSchema } from "@/lib/validation/domain";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot add domains" }, { status: 403 });
  }

  const parsed = domainSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: firstIssue(parsed.error) }, { status: 400 });

  const { id } = await params;
  try {
    await addDomain(context.organization.id, id, parsed.data.hostname);
    return Response.json({ hostname: parsed.data.hostname }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Application not found") {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }
    // The unique index on hostname is the only constraint that can fail here.
    return Response.json(
      { error: "That domain is already used by another application on this install." },
      { status: 409 },
    );
  }
}
