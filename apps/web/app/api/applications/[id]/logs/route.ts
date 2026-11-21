import {
  applicationInOrganization,
  getDb,
  listenToContainerLog,
  notifyChannel,
  selectRunningContainer,
} from "@enerthya/db";
import { currentOrganization } from "@/lib/current-org";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * The running container's output for one application, as server-sent events.
 * The worker tails the container and publishes; this stream only forwards.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: string) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const listener = listenToContainerLog(url, running.deploymentId, (line) =>
        send("line", line),
      );
      await listener.ready;
      await notifyChannel(db, "container_log_request", running.deploymentId);

      const heartbeat = setInterval(() => send("ping", ""), 15_000);

      const close = async () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        await listener.close();
        try {
          controller.close();
        } catch {
          // The client went away first.
        }
      };

      request.signal.addEventListener("abort", () => void close());
    },
    cancel() {
      // Handled by the abort listener.
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-store",
      connection: "keep-alive",
    },
  });
}
