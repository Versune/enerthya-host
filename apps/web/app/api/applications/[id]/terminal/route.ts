import { randomUUID } from "node:crypto";
import { roleAtLeast } from "@enerthya/core/roles";
import {
  applicationInOrganization,
  getDb,
  notifyChannel,
  selectRunningContainer,
} from "@enerthya/db";
import { currentOrganization } from "@/lib/current-org";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Opens a shell. The worker holds the TTY; this route only tells it which
 * container and returns the id the browser uses for input and output.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot open a terminal" }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  if (!(await applicationInOrganization(db, context.organization.id, id))) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }

  const running = await selectRunningContainer(db, context.organization.id, id);
  if (!running) return Response.json({ error: "Nothing is running." }, { status: 409 });

  const size = (await request.json().catch(() => ({}))) as { cols?: number; rows?: number };
  const sessionId = randomUUID();
  await notifyChannel(
    db,
    "terminal_start",
    JSON.stringify({
      sessionId,
      containerId: running.containerId,
      cols: Math.max(20, Math.min(300, Number(size.cols) || 80)),
      rows: Math.max(5, Math.min(120, Number(size.rows) || 24)),
    }),
  );

  return Response.json({ sessionId }, { status: 201 });
}

/** Ends the session and the shell behind it. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot close a terminal" }, { status: 403 });
  }

  const sessionId = new URL(request.url).searchParams.get("session");
  if (!sessionId) return Response.json({ error: "session is required" }, { status: 400 });

  const { id } = await params;
  const db = getDb();
  if (!(await applicationInOrganization(db, context.organization.id, id))) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }
  await notifyChannel(db, "terminal_close", JSON.stringify({ sessionId }));
  return Response.json({ ok: true });
}
