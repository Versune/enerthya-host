"use client";

import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef, useState } from "react";

type State = "idle" | "opening" | "open" | "closed" | "error";

/**
 * A shell inside the running container.
 *
 * The browser never talks to the runtime: opening creates a session in the
 * panel, output arrives as server-sent events, and keystrokes are POSTed back.
 * Typing is batched for 30 ms so a fast paste is one write, not forty.
 */
export function TerminalPanel({ applicationId }: { applicationId: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);

  // Tear the shell down when the panel goes away, without waiting for the
  // session's own lifetime cap.
  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (!session) return;
      void fetch(`/api/applications/${applicationId}/terminal?session=${session}`, {
        method: "DELETE",
      }).catch(() => undefined);
    };
  }, [applicationId]);

  const open = async () => {
    setState("opening");
    setError(null);
    try {
      const response = await fetch(`/api/applications/${applicationId}/terminal`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cols: 100, rows: 26 }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        sessionId?: string;
        error?: string;
      };
      if (!response.ok || !body.sessionId) {
        setError(body.error ?? `The panel answered ${response.status}.`);
        setState("error");
        return;
      }
      sessionRef.current = body.sessionId;
      setState("open");
    } catch {
      setError("The panel did not answer.");
      setState("error");
    }
  };

  useEffect(() => {
    if (state !== "open" || !sessionRef.current || !hostRef.current) return;
    let disposed = false;
    let source: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let term: { dispose: () => void } | null = null;
    let pending = "";

    const flush = () => {
      const data = pending;
      pending = "";
      if (!data || !sessionRef.current) return;
      void fetch(`/api/applications/${applicationId}/terminal/input`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: sessionRef.current, data }),
      }).catch(() => undefined);
    };

    void (async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
      ]);
      if (disposed || !hostRef.current) return;

      const instance = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        theme: { background: "#111111", foreground: "#eeeeee", cursor: "#eeeeee" },
        convertEol: true,
      });
      const fit = new FitAddon();
      instance.loadAddon(fit);
      instance.open(hostRef.current);
      fit.fit();
      instance.focus();
      term = instance;

      source = new EventSource(
        `/api/applications/${applicationId}/terminal/stream?session=${sessionRef.current}`,
      );
      source.addEventListener("data", (event) => {
        try {
          instance.write(JSON.parse((event as MessageEvent<string>).data) as string);
        } catch {
          // Ignore a malformed frame.
        }
      });
      source.addEventListener("failure", (event) => {
        try {
          const message = JSON.parse((event as MessageEvent<string>).data) as string;
          instance.writeln(`\r\n[enerthya] ${message}`);
          setError(message);
        } catch {
          // Ignore a malformed frame.
        }
      });
      source.addEventListener("error", () => {
        instance.writeln("\r\n[enerthya] stream closed");
        setState("closed");
      });

      instance.onData((data) => {
        pending += data;
        if (timer) return;
        timer = setTimeout(() => {
          timer = null;
          flush();
        }, 30);
      });
    })();

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      source?.close();
      term?.dispose();
      term = null;
    };
  }, [state, applicationId]);

  return (
    <details className="deployment__log" open={state === "open"}>
      <summary>Terminal</summary>
      <div className="terminal">
        {state === "idle" || state === "error" ? (
          <button className="btn btn--quiet" type="button" onClick={() => void open()}>
            Open a shell
          </button>
        ) : null}
        {state === "opening" ? <p className="deployment__meta">Opening…</p> : null}
        {state === "closed" ? <p className="deployment__meta">Session closed.</p> : null}
        {error ? (
          <p className="status" role="alert">
            <strong>The shell did not open.</strong>
            {error}
          </p>
        ) : null}
        <div ref={hostRef} className="terminal__host" />
      </div>
    </details>
  );
}
