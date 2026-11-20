"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ServerActions({ id, isLocal }: { id: string; isLocal: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<"test" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: "test" | "delete") => {
    setPending(action);
    setError(null);
    try {
      const response = await fetch(
        action === "test" ? `/api/servers/${id}/test` : `/api/servers/${id}`,
        { method: action === "test" ? "POST" : "DELETE" },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `The panel answered ${response.status}.`);
        return;
      }
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
