"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  return (
    <button
      className="btn"
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        window.location.assign("/sign-in");
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
