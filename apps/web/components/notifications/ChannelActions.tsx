"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChannelActions({ id }: { id: string }) {
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
          const response = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
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
