export type HostStats = {
  cpuPercent: number;
  /** 1-minute load average, as the OS reports it. */
  loadAverage: number;
  memoryUsed: number;
  memoryTotal: number;
  diskUsed: number;
  diskTotal: number;
  diskPercent: number;
  uptimeSeconds: number;
  cores: number;
  platform: string;
};

/** What the worker collects from systeminformation; only what is charted. */
export type HostStatsInput = {
  load: { currentLoad: number | null; avgLoad: number | null };
  memory: { total: number; used: number };
  disk: { size: number; used: number };
  uptimeSeconds: number;
  cores: number;
  platform: string;
};

function percent(used: number, total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.round((used / total) * 1000) / 10;
}

/**
 * Normalises the collector's numbers into one sample. Kept pure so a machine
 * with no disks, a zero memory total (some containers) or a null load can be
 * tested without systeminformation.
 */
export function readHostStats(input: HostStatsInput): HostStats {
  return {
    cpuPercent: Math.round((input.load.currentLoad ?? 0) * 10) / 10,
    loadAverage: input.load.avgLoad ?? 0,
    memoryUsed: input.memory.used,
    memoryTotal: input.memory.total,
    diskUsed: input.disk.used,
    diskTotal: input.disk.size,
    diskPercent: percent(input.disk.used, input.disk.size),
    uptimeSeconds: input.uptimeSeconds,
    cores: input.cores,
    platform: input.platform,
  };
}
