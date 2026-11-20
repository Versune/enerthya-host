"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOut() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  return (
    <button
      className="btn"
      type="button"
      disabled={leaving}
      onClick={async () => {
        setLeaving(true);
        try {
          await fetch("/api/logout", { method: "POST" });
          router.replace("/");
          router.refresh();
        } finally {
          setLeaving(false);
        }
      }}
    >
      {leaving ? "Signing out…" : "Sign out"}
    </button>
  );
}
