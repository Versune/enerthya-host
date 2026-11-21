"use client";

import { useEffect, useState } from "react";

const LIVE_STATUSES = new Set(["queued", "building", "deploying", "healthcheck"]);

export function DeploymentLog({
  id,
  initial,
  status,
}: {
  id: string;
  initial: string | null;
  status: string;
}) {
  const [log, setLog] = useState(initial ?? "");
  const live = LIVE_STATUSES.has(status);

  useEffect(() => {
    if (!live) return;
    const source = new EventSource(`/api/deployments/${id}/log`);
    source.addEventListener("log", (event) => {
      try {
        setLog(JSON.parse((event as MessageEvent<string>).data) as string);
      } catch {
        // A malformed frame is not worth breaking the view over.
      }
    });
    return () => source.close();
  }, [id, live]);

  if (!log) return null;

  return (
    <details className="deployment__log">
      <summary>Log</summary>
      <pre>{log}</pre>
    </details>
  );
}
