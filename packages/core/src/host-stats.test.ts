import { describe, expect, it } from "vitest";
import { readHostStats } from "./host-stats";

const base = {
  load: { currentLoad: 12.34, avgLoad: 1.5 },
  memory: { total: 16 * 1024 ** 3, used: 4 * 1024 ** 3 },
  disk: { size: 100 * 1024 ** 3, used: 25 * 1024 ** 3 },
  uptimeSeconds: 86_400,
  cores: 8,
  platform: "linux",
};

describe("readHostStats", () => {
  it("rounds the CPU to one decimal and keeps the rest", () => {
    const sample = readHostStats(base);
    expect(sample.cpuPercent).toBe(12.3);
    expect(sample.loadAverage).toBe(1.5);
    expect(sample.cores).toBe(8);
    expect(sample.platform).toBe("linux");
  });

  it("computes the disk percentage", () => {
    expect(readHostStats(base).diskPercent).toBe(25);
  });

  it("reports zero for a null load rather than NaN", () => {
    const sample = readHostStats({ ...base, load: { currentLoad: null, avgLoad: null } });
    expect(sample.cpuPercent).toBe(0);
    expect(sample.loadAverage).toBe(0);
  });

  it("does not divide by a zero-sized disk", () => {
    expect(readHostStats({ ...base, disk: { size: 0, used: 0 } }).diskPercent).toBe(0);
  });
});
