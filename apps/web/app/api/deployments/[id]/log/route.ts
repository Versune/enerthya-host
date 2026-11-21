import {
  deploymentInOrganization,
  getDb,
  listenToDeploymentLog,
  selectDeploymentLog,
} from "@enerthya/db";
import { currentOrganization } from "@/lib/current-org";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-sent events for one deployment's log. The worker writes a line and
 * calls pg_notify; this stream listens on that channel and re-reads the row, so
 * there is no polling and no second source of truth.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  if (!(await deploymentInOrganization(getDb(), context.organization.id, id))) {
    return Response.json({ error: "Deployment not found" }, { status: 404 });
  }

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
      const sendCurrent = async () => send("log", (await selectDeploymentLog(getDb(), id)) ?? "");

      await sendCurrent();

      const listener = listenToDeploymentLog(url, id, () => void sendCurrent());
      await listener.ready;

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
      // The reader cancelled; the abort listener above tears the connection down.
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
