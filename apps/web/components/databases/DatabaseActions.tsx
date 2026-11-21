"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DatabaseActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      className="btn btn--quiet"
      type="button"
      disabled={pending}
      onClick={async () => {
        if (!window.confirm("Remove the database and its volume? The data is deleted.")) return;
        setPending(true);
        try {
          const response = await fetch(`/api/databases/${id}`, { method: "DELETE" });
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
