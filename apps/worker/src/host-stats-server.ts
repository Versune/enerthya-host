import { readHostStats } from "@enerthya/core/host-stats";
import { type ChannelListener, getDb, listenToChannel, notifyChannel } from "@enerthya/db";
import si from "systeminformation";
import { logger } from "./log";

/** One reading of the machine the worker runs on. */
export async function collectHostStats() {
  const [load, memory, disks, time, cpu, os] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.time(),
    si.cpu(),
    si.osInfo(),
  ]);

  // The root filesystem is the one an operator means; containers have several.
  const root = disks.find((disk) => disk.mount === "/") ?? disks[0];

  return readHostStats({
    load: { currentLoad: load.currentLoad ?? null, avgLoad: load.avgLoad ?? null },
    memory: { total: memory.total, used: memory.active || memory.used },
    disk: { size: root?.size ?? 0, used: root?.used ?? 0 },
    uptimeSeconds: time.uptime,
    cores: cpu.cores,
    platform: `${os.distro} ${os.release}`.trim() || os.platform,
  });
}

/**
 * Answers one `host_stats_request` (an opaque id) with one sample on
 * `host_stats`. On demand, like the container sample: an idle panel costs the
 * machine nothing.
 */
export function startHostStatsServer(databaseUrl: string): ChannelListener {
  const db = getDb();

  return listenToChannel(databaseUrl, "host_stats_request", (requestId) => {
    void (async () => {
      try {
        const sample = await collectHostStats();
        await notifyChannel(db, "host_stats", JSON.stringify({ id: requestId, ...sample }));
      } catch (error) {
        logger.error({ err: (error as Error).message }, "host stats failed");
        await notifyChannel(
          db,
          "host_stats",
          JSON.stringify({
            id: requestId,
            error: error instanceof Error ? error.message : "Could not read this machine.",
          }),
        );
      }
    })();
  });
}
