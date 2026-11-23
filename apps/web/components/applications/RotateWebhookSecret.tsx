"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Replacing the secret is the way to revoke one that was seen by someone who
 * should not have it — the old value stops verifying on the next push.
 */
export function RotateWebhookSecret({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rotate = async () => {
    if (!confirm("Replace the existing secret? GitHub will reject pushes signed with the old one."))
      return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/applications/${applicationId}/webhook-secret`, {
        method: "POST",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `The panel answered ${response.status}.`);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <span className="hook__rotate">
      <button className="btn btn--quiet" type="button" onClick={rotate} disabled={pending}>
        {pending ? "Rotating…" : "Rotate"}
      </button>
      {error ? <span className="form__error">{error}</span> : null}
    </span>
  );
}
