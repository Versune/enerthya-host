import { connectRuntime, readContainerStats } from "@enerthya/core/runtime";
import { readStats } from "@enerthya/core/stats";
import {
  type ChannelListener,
  getDb,
  listenToChannel,
  notifyChannel,
  selectDeploymentContainer,
} from "@enerthya/db";

/**
 * Answers one `container_stats_request` (a deployment id) with one sample on
 * `container_stats`. On demand rather than polled from the worker: an idle
 * panel should not cost the runtime anything.
 */
export function startStatsServer(databaseUrl: string): ChannelListener {
  const db = getDb();

  return listenToChannel(databaseUrl, "container_stats_request", (deploymentId) => {
    void (async () => {
      const reply = (payload: Record<string, unknown>) =>
        notifyChannel(db, "container_stats", JSON.stringify({ id: deploymentId, ...payload }));

      const row = await selectDeploymentContainer(db, deploymentId).catch(() => null);
      if (!row?.containerId) return reply({ error: "No container to read." });

      const runtime = await connectRuntime().catch(() => null);
      if (!runtime) return reply({ error: "No runtime answered." });

      try {
        const payload = await readContainerStats(runtime.client, row.containerId);
        return reply(readStats(payload));
      } catch (error) {
        return reply({
          error: error instanceof Error ? error.message : "The runtime refused the request.",
        });
      }
    })();
  });
}
