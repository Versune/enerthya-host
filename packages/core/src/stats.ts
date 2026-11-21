/** The parts of dockerode's stats payload this needs, typed narrowly. */
export type ContainerStatsPayload = {
  cpu_stats?: {
    cpu_usage?: { total_usage?: number };
    system_cpu_usage?: number;
    online_cpus?: number;
  };
  precpu_stats?: {
    cpu_usage?: { total_usage?: number };
    system_cpu_usage?: number;
  };
  memory_stats?: { usage?: number; limit?: number };
};

export type ContainerStats = {
  cpuPercent: number;
  memoryUsed: number;
  memoryLimit: number;
};

/**
 * Docker reports cumulative counters, so a percentage needs the delta between
 * this sample and the previous one in the same payload. A zero system delta
 * means there is nothing to divide by — report 0 instead of NaN.
 */
export function readStats(payload: ContainerStatsPayload): ContainerStats {
  const cpu = payload.cpu_stats?.cpu_usage?.total_usage ?? 0;
  const preCpu = payload.precpu_stats?.cpu_usage?.total_usage ?? 0;
  const system = payload.cpu_stats?.system_cpu_usage ?? 0;
  const preSystem = payload.precpu_stats?.system_cpu_usage ?? 0;

  const cpuDelta = Math.max(cpu - preCpu, 0);
  const systemDelta = system - preSystem;
  const cpus = payload.cpu_stats?.online_cpus ?? 1;

  const cpuPercent = systemDelta > 0 && cpuDelta > 0 ? (cpuDelta / systemDelta) * cpus * 100 : 0;

  return {
    cpuPercent: Math.round(cpuPercent * 10) / 10,
    memoryUsed: payload.memory_stats?.usage ?? 0,
    memoryLimit: payload.memory_stats?.limit ?? 0,
  };
}
