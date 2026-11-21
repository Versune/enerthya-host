import { describe, expect, it } from "vitest";
import { readStats } from "./stats";

describe("readStats", () => {
  it("turns cumulative counters into a percentage across the online CPUs", () => {
    const stats = readStats({
      cpu_stats: {
        cpu_usage: { total_usage: 3_000_000 },
        system_cpu_usage: 30_000_000,
        online_cpus: 2,
      },
      precpu_stats: { cpu_usage: { total_usage: 1_000_000 }, system_cpu_usage: 10_000_000 },
    });
    // 2/20 of the system time, across 2 CPUs → 20%.
    expect(stats.cpuPercent).toBe(20);
  });

  it("reports zero instead of dividing by a zero system delta", () => {
    const stats = readStats({
      cpu_stats: { cpu_usage: { total_usage: 5 }, system_cpu_usage: 100, online_cpus: 4 },
      precpu_stats: { cpu_usage: { total_usage: 5 }, system_cpu_usage: 100 },
    });
    expect(stats.cpuPercent).toBe(0);
  });

  it("carries memory through, defaulting to zero when absent", () => {
    expect(readStats({ memory_stats: { usage: 1024, limit: 4096 } })).toMatchObject({
      memoryUsed: 1024,
      memoryLimit: 4096,
    });
    expect(readStats({}).memoryLimit).toBe(0);
  });
});
