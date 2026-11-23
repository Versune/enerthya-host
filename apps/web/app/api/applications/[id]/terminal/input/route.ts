import { roleAtLeast } from "@enerthya/core/roles";
import { applicationInOrganization, getDb, notifyChannel } from "@enerthya/db";
import { currentOrganization } from "@/lib/current-org";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Keystrokes. Each POST is one write to the shell; the worker owns the TTY. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot use a terminal" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { sessionId?: string; data?: string };
  if (!body.sessionId || typeof body.data !== "string" || body.data.length > 4096) {
    return Response.json({ error: "sessionId and data (<= 4 KiB) are required" }, { status: 400 });
  }

  const { id } = await params;
  const db = getDb();
  if (!(await applicationInOrganization(db, context.organization.id, id))) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }
  await notifyChannel(
    db,
    "terminal_input",
    JSON.stringify({ sessionId: body.sessionId, applicationId: id, data: body.data }),
  );
  return Response.json({ ok: true });
}
