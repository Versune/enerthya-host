import { randomUUID } from "node:crypto";
import { getDb, listenToChannel, notifyChannel } from "@enerthya/db";
import { currentOrganization } from "@/lib/current-org";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One reading of the machine that runs the worker. The request and the answer
 * travel over Postgres channels, like every other runtime read.
 */
export async function GET() {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });

  const url = process.env.DATABASE_URL;
  if (!url) return Response.json({ error: "DATABASE_URL is not set" }, { status: 503 });

  const db = getDb();
  const requestId = randomUUID();

  const sample = await new Promise<Record<string, unknown> | null>((resolve) => {
    const listener = listenToChannel(url, "host_stats", (payload) => {
      try {
        const message = JSON.parse(payload) as { id?: string };
        if (message.id === requestId) void listener.close().then(() => resolve(message));
      } catch {
        // Not one of our messages.
      }
    });

    void listener.ready.then(() => notifyChannel(db, "host_stats_request", requestId));
    setTimeout(() => {
      void listener.close().then(() => resolve(null));
    }, 5_000);
  });

  if (!sample) return Response.json({ error: "The worker did not answer." }, { status: 504 });
  if (typeof sample.error === "string")
    return Response.json({ error: sample.error }, { status: 503 });
  return Response.json(sample);
}
