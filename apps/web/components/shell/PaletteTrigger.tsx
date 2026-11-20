"use client";

import { useEffect, useState } from "react";

/** Visible affordance for the palette; the ⌘K listener still works anywhere. */
export function PaletteTrigger() {
  // The shell's server HTML paints before React attaches the palette listener;
  // the marker lets tests (and anyone debugging) wait for the handler.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <button
      type="button"
      className="topbar__hint topbar__hint--button"
      aria-label="Open command palette"
      data-hydrated={hydrated ? "true" : undefined}
      onClick={() => window.dispatchEvent(new Event("enerthya:palette"))}
    >
      ⌘K
    </button>
  );
}
