import { currentOrganization } from "@/lib/current-org";
import { createServer, listServers } from "@/lib/servers";
import { serverSchema } from "@/lib/validation/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });

  return Response.json({ servers: await listServers(context.organization.id) });
}

export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });

  const parsed = serverSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Check the values and try again." },
      { status: 400 },
    );
  }

  try {
    const server = await createServer({
      organizationId: context.organization.id,
      ...parsed.data,
      privateKey: parsed.data.privateKey || undefined,
    });
    return Response.json({ server }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The server could not be stored" },
      { status: 503 },
    );
  }
}
