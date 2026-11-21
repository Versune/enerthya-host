"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BackupActions({ databaseId }: { databaseId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="project__actions">
      <button
        className="btn btn--quiet"
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const response = await fetch(`/api/databases/${databaseId}/backups`, {
              method: "POST",
            });
            const body = (await response.json().catch(() => ({}))) as { error?: string };
            if (!response.ok) {
              setError(body.error ?? `The panel answered ${response.status}.`);
              return;
            }
            router.refresh();
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Starting…" : "Back up now"}
      </button>
      {error ? (
        <span className="server__error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
