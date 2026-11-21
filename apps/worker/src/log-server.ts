import { connectRuntime, streamContainerLogs } from "@enerthya/core/runtime";
import {
  type ChannelListener,
  getDb,
  listenToChannel,
  notifyChannel,
  selectDeploymentContainer,
} from "@enerthya/db";

const MAX_FOLLOW_MS = 5 * 60_000;

/**
 * The panel cannot reach the runtime, so it asks for container output over a
 * Postgres channel and the worker tails the container, publishing each line
 * back on another one. One request, one follower, stopped after five minutes so
 * a forgotten browser tab cannot hold a stream forever.
 */
export function startLogServer(databaseUrl: string): ChannelListener {
  const db = getDb();

  return listenToChannel(databaseUrl, "container_log_request", (deploymentId) => {
    void (async () => {
      const row = await selectDeploymentContainer(db, deploymentId).catch(() => null);
      if (!row?.containerId) {
        await notifyChannel(
          db,
          "container_log",
          JSON.stringify({ id: deploymentId, line: "[enerthya] No container to read." }),
        );
        return;
      }

      const runtime = await connectRuntime().catch(() => null);
      if (!runtime) {
        await notifyChannel(
          db,
          "container_log",
          JSON.stringify({ id: deploymentId, line: "[enerthya] No runtime answered." }),
        );
        return;
      }

      const stop = streamContainerLogs(runtime.client, row.containerId, (line) => {
        void notifyChannel(db, "container_log", JSON.stringify({ id: deploymentId, line }));
      });
      setTimeout(stop, MAX_FOLLOW_MS);
    })();
  });
}
