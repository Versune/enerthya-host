import { publishRoutes } from "@enerthya/core/proxy";
import {
  type ChannelListener,
  getDb,
  listenToChannel,
  selectDomainRoutes,
  withAdvisoryLock,
} from "@enerthya/db";
import { logger } from "./log";

/**
 * The panel cannot reach Caddy (its admin endpoint lives on the proxy's
 * loopback), so a domain added or removed sends a notification and the worker
 * republishes. The same code runs on boot: a Caddy that restarted empty is
 * repaired without waiting for the next deployment.
 */
export async function publishAllRoutes(): Promise<void> {
  const adminUrl = process.env.CADDY_ADMIN_URL;
  if (!adminUrl) return;
  const result = await withAdvisoryLock(
    getDb(),
    "proxy:routes",
    async () => publishRoutes(adminUrl, await selectDomainRoutes(getDb())),
    { waitMs: 60_000 },
  );
  if (!result.locked) logger.warn("route publish skipped: another publish is running");
}

export function startProxyServer(databaseUrl: string): ChannelListener {
  const listener = listenToChannel(databaseUrl, "proxy_publish", () => {
    void publishAllRoutes().catch((error) =>
      logger.warn({ error: (error as Error).message }, "route publish failed"),
    );
  });
  void listener.ready.then(() =>
    publishAllRoutes().catch((error) =>
      logger.warn({ error: (error as Error).message }, "initial route publish failed"),
    ),
  );
  return listener;
}
