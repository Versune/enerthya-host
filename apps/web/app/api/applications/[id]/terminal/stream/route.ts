import { applicationInOrganization, getDb, listenToChannel } from "@enerthya/db";
import { currentOrganization } from "@/lib/current-org";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Payload = { sessionId: string; data?: string; error?: string };

/**
 * The shell's output, as server-sent events. The worker writes to
 * terminal_output; this stream forwards only the frames of one session.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });

  const sessionId = new URL(request.url).searchParams.get("session");
  if (!sessionId) return Response.json({ error: "session is required" }, { status: 400 });

  const { id } = await params;
  const db = getDb();
  if (!(await applicationInOrganization(db, context.organization.id, id))) {
    return Response.json({ error: "Application not found" }, { status: 404 });
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

      const listener = listenToChannel(url, "terminal_output", (payload) => {
        try {
          const parsed = JSON.parse(payload) as Payload;
          if (parsed.sessionId !== sessionId) return;
          if (parsed.error) send("failure", parsed.error);
          else if (parsed.data) send("data", parsed.data);
        } catch {
          // A malformed frame is dropped, not forwarded.
        }
      });
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
      // The reader closed the stream; the listener is released by abort.
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
