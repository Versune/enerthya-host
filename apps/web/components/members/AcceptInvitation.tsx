"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AcceptInvitation({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="stack">
      <button
        className="btn"
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const response = await fetch("/api/invitations/accept", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ id }),
            });
            const body = (await response.json().catch(() => ({}))) as { error?: string };
            if (!response.ok) {
              setError(body.error ?? `The panel answered ${response.status}.`);
              return;
            }
            router.push("/");
            router.refresh();
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Accepting…" : "Accept invitation"}
      </button>
      {error ? (
        <p className="status" role="alert">
          <strong>The panel refused the request.</strong>
          {error}
        </p>
      ) : null}
    </div>
  );
}
