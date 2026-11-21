import {
  applicationInOrganization,
  getDb,
  listenToChannel,
  notifyChannel,
  selectRunningContainer,
} from "@enerthya/db";
import { currentOrganization } from "@/lib/current-org";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One sample for one application. The request goes to the worker over a
 * Postgres channel and the answer comes back the same way; the panel never
 * reaches the runtime itself.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  if (!(await applicationInOrganization(db, context.organization.id, id))) {
    return Response.json({ error: "Application not found" }, { status: 404 });
  }

  const running = await selectRunningContainer(db, context.organization.id, id);
  if (!running) return Response.json({ error: "Nothing is running." }, { status: 409 });

  const url = process.env.DATABASE_URL;
  if (!url) return Response.json({ error: "DATABASE_URL is not set" }, { status: 503 });

  const sample = await new Promise<Record<string, unknown> | null>((resolve) => {
    const listener = listenToChannel(url, "container_stats", (payload) => {
      try {
        const message = JSON.parse(payload) as { id?: string };
        if (message.id === running.deploymentId) void listener.close().then(() => resolve(message));
      } catch {
        // Not one of our messages.
      }
    });

    void listener.ready.then(() =>
      notifyChannel(db, "container_stats_request", running.deploymentId),
    );
    setTimeout(() => {
      void listener.close().then(() => resolve(null));
    }, 5_000);
  });

  if (!sample) return Response.json({ error: "The worker did not answer." }, { status: 504 });
  if (typeof sample.error === "string") {
    return Response.json({ error: sample.error }, { status: 503 });
  }
  return Response.json(sample);
}
