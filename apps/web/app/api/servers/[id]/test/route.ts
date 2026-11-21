import { currentOrganization } from "@/lib/current-org";
import { testServer } from "@/lib/servers";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });

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
