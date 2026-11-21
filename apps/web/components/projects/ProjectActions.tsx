"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProjectActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="project__actions">
      <button
        className="btn btn--quiet"
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
            if (!response.ok) {
              const body = (await response.json().catch(() => ({}))) as { error?: string };
              setError(body.error ?? `The panel answered ${response.status}.`);
              return;
            }
            router.refresh();
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {error ? (
        <span className="server__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
