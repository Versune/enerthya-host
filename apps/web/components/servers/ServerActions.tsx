"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Action = "test" | "delete" | "forget";

export function ServerActions({
  id,
  isLocal,
  hasHostKey,
}: {
  id: string;
  isLocal: boolean;
  hasHostKey: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: Action) => {
    setPending(action);
    setError(null);
    try {
      const request =
        action === "test"
          ? { url: `/api/servers/${id}/test`, method: "POST" }
          : action === "delete"
            ? { url: `/api/servers/${id}`, method: "DELETE" }
            : { url: `/api/servers/${id}/host-key`, method: "DELETE" };

      const response = await fetch(request.url, { method: request.method });
      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(body.error ?? `The panel answered ${response.status}.`);
        return;
      }
      if (body.error) setError(body.error);
      router.refresh();
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="server__actions">
      <button
        className="btn btn--quiet"
        type="button"
        disabled={pending !== null}
        onClick={() => run("test")}
      >
        {pending === "test" ? "Testing…" : isLocal ? "Check runtime" : "Test"}
      </button>
      {hasHostKey ? (
        <button
          className="btn btn--quiet"
          type="button"
          disabled={pending !== null}
          onClick={() => run("forget")}
        >
          {pending === "forget" ? "Forgetting…" : "Forget key"}
        </button>
      ) : null}
      <button
        className="btn btn--quiet"
        type="button"
        disabled={pending !== null}
        onClick={() => run("delete")}
      >
        {pending === "delete" ? "Removing…" : "Remove"}
      </button>
      {error ? (
        <span className="server__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
