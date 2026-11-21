"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApplicationActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"deploy" | "remove" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const post = async (path: string, method: "POST" | "DELETE", ok: string) => {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(path, { method });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? `The panel answered ${response.status}.`);
        return;
      }
      setMessage(ok);
      router.refresh();
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="project__actions">
      <button
        className="btn btn--quiet"
        type="button"
        disabled={pending !== null}
        onClick={() => {
          setPending("deploy");
          void post(
            `/api/applications/${id}/deploy`,
            "POST",
            "Queued. The worker picks it up next.",
          );
        }}
      >
        {pending === "deploy" ? "Queueing…" : "Deploy"}
      </button>
      <button
        className="btn btn--quiet"
        type="button"
        disabled={pending !== null}
        onClick={() => {
          setPending("remove");
          void post(`/api/applications/${id}`, "DELETE", "Removed.");
        }}
      >
        {pending === "remove" ? "Removing…" : "Remove"}
      </button>
      {message ? <span className="server__note">{message}</span> : null}
      {error ? (
        <span className="server__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
