"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

/**
 * Dark is the default (the layout ships `data-theme="dark"`). The inline
 * script in the layout applies a stored choice before paint, so this control
 * only has to flip the attribute and remember it.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    setMounted(true);
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = next === "light" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      title={label}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("theme", next);
        } catch {
          // Storage can be blocked; the choice then lasts for this document only.
        }
        setTheme(next);
      }}
    >
      {mounted && theme === "light" ? (
        <Moon aria-hidden="true" size={16} />
      ) : (
        <Sun aria-hidden="true" size={16} />
      )}
    </button>
  );
}
