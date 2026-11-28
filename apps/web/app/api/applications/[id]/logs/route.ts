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
 * Every open stream pins a dedicated Postgres connection, so concurrent streams
 * are capped per user and per process. The counts live in this module, which is
 * enough to keep one browser or one read-only member from exhausting the pool.
 */
const MAX_STREAMS_PER_USER = 4;
const MAX_STREAMS_TOTAL = 64;

const streamsPerUser = new Map<string, number>();
let streamsTotal = 0;

/** Reserves one stream slot. Returns an idempotent release, or null at the cap. */
function acquireStream(userId: string): (() => void) | null {
  const forUser = streamsPerUser.get(userId) ?? 0;
  if (forUser >= MAX_STREAMS_PER_USER || streamsTotal >= MAX_STREAMS_TOTAL) return null;
  streamsPerUser.set(userId, forUser + 1);
  streamsTotal += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    streamsTotal -= 1;
    const remaining = (streamsPerUser.get(userId) ?? 1) - 1;
    if (remaining > 0) streamsPerUser.set(userId, remaining);
    else streamsPerUser.delete(userId);
  };
}

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

  if (!context.session) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const release = acquireStream(context.session.user.id);
  if (!release) {
    return Response.json(
      { error: "Too many log streams are open. Close another one and try again." },
      { status: 429 },
    );
  }

  const encoder = new TextEncoder();
  let closed = false;
  let controllerRef: { close: () => void } | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let listener: ReturnType<typeof listenToContainerLog> | null = null;

  const close = async () => {
    if (closed) return;
    closed = true;
    if (heartbeat !== null) clearInterval(heartbeat);
    release();
    if (listener) await listener.close();
    try {
      controllerRef?.close();
    } catch {
      // The client went away first.
    }
  };

  try {
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controllerRef = controller;
        const send = (event: string, data: string) => {
          if (closed) return;
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
            );
          } catch {
            void close();
          }
        };

        request.signal.addEventListener("abort", () => void close());

        try {
          if (request.signal.aborted) {
            await close();
            return;
          }

          const nextListener = listenToContainerLog(url, running.deploymentId, (line) =>
            send("line", line),
          );
          listener = nextListener;
          await nextListener.ready;
          if (closed) {
            await nextListener.close();
            return;
          }

          await notifyChannel(db, "container_log_request", running.deploymentId);
          if (closed) return;

          heartbeat = setInterval(() => send("ping", ""), 15_000);
        } catch {
          await close();
        }
      },
      cancel() {
        // The reader cancelled; free the slot and the database connection.
        void close();
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-store",
        connection: "keep-alive",
      },
    });
  } catch (error) {
    await close();
    throw error;
  }
}
