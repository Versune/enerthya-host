"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DomainActions({
  applicationId,
  domainId,
}: {
  applicationId: string;
  domainId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      className="btn btn--quiet"
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const response = await fetch(`/api/applications/${applicationId}/domains/${domainId}`, {
            method: "DELETE",
          });
          if (response.ok) router.refresh();
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
