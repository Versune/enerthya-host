import postgres from "postgres";

export type DeploymentLogListener = {
  ready: Promise<void>;
  close: () => Promise<void>;
};

/**
 * Listens on the channel the worker notifies after writing a log line. The
 * panel never polls: it holds this connection and re-reads the row when its own
 * deployment is named.
 */
export function listenToDeploymentLog(
  databaseUrl: string,
  deploymentId: string,
  onLine: () => void,
): DeploymentLogListener {
  const client = postgres(databaseUrl, { max: 1 });
  let closed = false;

  const ready = client
    .listen("deployment_log", (payload: string) => {
      if (payload === deploymentId && !closed) onLine();
    })
    .then(() => undefined);

  return {
    ready,
    async close() {
      if (closed) return;
      closed = true;
      await ready.catch(() => undefined);
      await client.end({ timeout: 2 }).catch(() => undefined);
    },
  };
}
