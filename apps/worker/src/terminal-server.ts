/**
 * Web terminal transport.
 *
 * The panel cannot reach the container runtime, so a session is a conversation
 * over two Postgres channels, the same way container logs already travel:
 *
 *   panel  --terminal_start-->  worker opens a TTY exec
 *   panel  --terminal_input-->  worker writes the keystrokes
 *   worker --terminal_output--> panel forwards to the browser (SSE)
 *   panel  --terminal_close-->  worker ends the exec
 *
 * Sessions are keyed by an id the panel creates, capped in number and in
 * lifetime, and closed when their stream ends.
 */
import { connectRuntime, openTerminal, type TerminalSession } from "@enerthya/core/runtime";
import { type ChannelListener, getDb, listenToChannel, notifyChannel } from "@enerthya/db";
import { logger } from "./log";

const MAX_SESSIONS = 8;
const MAX_LIFETIME_MS = 30 * 60_000;

type StartMessage = {
  sessionId: string;
  applicationId: string;
  containerId: string;
  cols?: number;
  rows?: number;
};

type InputMessage = { sessionId: string; applicationId: string; data: string };

type Running = {
  session: TerminalSession;
  timer: NodeJS.Timeout;
  applicationId: string;
};

/** Keeps one process from holding the runtime open forever. */
export function startTerminalServer(databaseUrl: string): ChannelListener {
  const db = getDb();
  const sessions = new Map<string, Running>();

  const stop = (sessionId: string, reason: string) => {
    const running = sessions.get(sessionId);
    if (!running) return;
    clearTimeout(running.timer);
    running.session.close();
    sessions.delete(sessionId);
    logger.info({ sessionId, reason }, "terminal closed");
  };

  const start = async (message: StartMessage) => {
    if (sessions.size >= MAX_SESSIONS) {
      await notifyChannel(
        db,
        "terminal_output",
        JSON.stringify({
          sessionId: message.sessionId,
          applicationId: message.applicationId,
          error: "Too many open terminals.",
        }),
      );
      return;
    }

    const runtime = await connectRuntime().catch(() => null);
    if (!runtime) {
      await notifyChannel(
        db,
        "terminal_output",
        JSON.stringify({
          sessionId: message.sessionId,
          applicationId: message.applicationId,
          error: "No container runtime answered.",
        }),
      );
      return;
    }

    try {
      const session = await openTerminal(runtime.client, message.containerId, {
        cols: message.cols ?? 80,
        rows: message.rows ?? 24,
        onData: (chunk) => {
          void notifyChannel(
            db,
            "terminal_output",
            JSON.stringify({
              sessionId: message.sessionId,
              applicationId: message.applicationId,
              data: chunk,
            }),
          );
        },
        onExit: () => stop(message.sessionId, "process exited"),
      });

      const timer = setTimeout(() => stop(message.sessionId, "lifetime exceeded"), MAX_LIFETIME_MS);
      timer.unref();
      sessions.set(message.sessionId, { session, timer, applicationId: message.applicationId });
      logger.info({ sessionId: message.sessionId }, "terminal opened");
    } catch (error) {
      await notifyChannel(
        db,
        "terminal_output",
        JSON.stringify({
          sessionId: message.sessionId,
          applicationId: message.applicationId,
          error: `Could not open a shell: ${(error as Error).message}`,
        }),
      );
    }
  };

  const listener = listenToChannel(databaseUrl, "terminal_start", (payload) => {
    void (async () => {
      const parsed = safeParse<StartMessage>(payload);
      if (parsed) await start(parsed);
    })();
  });

  // A session is only addressable from the application that opened it; an id
  // alone is not enough to type into or end someone else's shell.
  const inputListener = listenToChannel(databaseUrl, "terminal_input", (payload) => {
    const parsed = safeParse<InputMessage>(payload);
    if (!parsed) return;
    const running = sessions.get(parsed.sessionId);
    if (!running || running.applicationId !== parsed.applicationId) {
      logger.warn({ sessionId: parsed.sessionId }, "terminal input ignored: wrong application");
      return;
    }
    running.session.write(parsed.data);
  });

  const closeListener = listenToChannel(databaseUrl, "terminal_close", (payload) => {
    const parsed = safeParse<{ sessionId: string; applicationId: string }>(payload);
    if (!parsed) return;
    const running = sessions.get(parsed.sessionId);
    if (!running || running.applicationId !== parsed.applicationId) return;
    stop(parsed.sessionId, "requested by the panel");
  });

  // The listeners live as long as the process; the first one is returned so the
  // caller has something to close on shutdown.
  void inputListener.ready;
  void closeListener.ready;
  return listener;
}

function safeParse<T>(payload: string): T | null {
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}
