"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV_ITEMS } from "@/components/shell/Sidebar";

/**
 * ⌘K / Ctrl+K navigation. A native dialog keeps focus handling and Escape
 * for free; the list is the same one the sidebar shows, so the two cannot
 * drift.
 */
export function CommandPalette() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const open = () => {
      dialogRef.current?.showModal();
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("enerthya:palette", open);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("enerthya:palette", open);
    };
  }, []);

  const matches = NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const go = (href: string) => {
    dialogRef.current?.close();
    router.push(href);
  };

  return (
    <dialog
      className="palette"
      ref={dialogRef}
      aria-label="Command palette"
      onClose={() => setQuery("")}
    >
      <input
        className="palette__input"
        ref={inputRef}
        value={query}
        placeholder="Go to…"
        aria-label="Go to"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && matches[0]) go(matches[0].href);
        }}
      />
      <ul className="palette__list">
        {matches.map((item) => (
          <li key={item.href}>
            <button className="palette__item" type="button" onClick={() => go(item.href)}>
              {item.label}
            </button>
          </li>
        ))}
        {matches.length === 0 ? <li className="palette__empty">Nothing matches.</li> : null}
      </ul>
      <p className="palette__foot">Enter opens the first match · Esc closes</p>
    </dialog>
  );
}
