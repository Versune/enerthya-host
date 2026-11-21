"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Follows the running container while the section is open. The stream comes
 * from the worker through the panel; nothing is read from this browser.
 */
export function ContainerLogs({ applicationId }: { applicationId: string }) {
  const [lines, setLines] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "live" | "none">("idle");
  const listRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const source = new EventSource(`/api/applications/${applicationId}/logs`);
    setState("live");

    source.addEventListener("line", (event) => {
      try {
        const line = JSON.parse((event as MessageEvent<string>).data) as string;
        setLines((current) => [...current.slice(-499), line]);
      } catch {
        // Ignore a malformed frame.
      }
    });
    source.addEventListener("error", () => {
      setState("none");
      source.close();
    });

    return () => source.close();
  }, [applicationId]);

  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, []);

  return (
    <details className="deployment__log">
      <summary>Container output</summary>
      <pre ref={listRef}>
        {lines.length > 0
          ? lines.join("\n")
          : state === "none"
            ? "Nothing is running, or the stream closed."
            : "Waiting for output…"}
      </pre>
    </details>
  );
}
