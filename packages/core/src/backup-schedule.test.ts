import { describe, expect, it } from "vitest";
import {
  isBackupDue,
  nextBackupAt,
  retentionCutoff,
  selectExpiredBackups,
} from "./backup-schedule";

const now = new Date("2026-11-21T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

describe("isBackupDue", () => {
  it("never schedules a database without an interval", () => {
    expect(isBackupDue({ intervalHours: null, lastBackupAt: null }, now)).toBe(false);
    expect(isBackupDue({ intervalHours: 0, lastBackupAt: daysAgo(30) }, now)).toBe(false);
  });

  it("runs immediately when nothing has run yet", () => {
    expect(isBackupDue({ intervalHours: 24, lastBackupAt: null }, now)).toBe(true);
  });

  it("waits for the interval and then fires", () => {
    expect(isBackupDue({ intervalHours: 6, lastBackupAt: hoursAgo(5) }, now)).toBe(false);
    expect(isBackupDue({ intervalHours: 6, lastBackupAt: hoursAgo(6) }, now)).toBe(true);
    expect(isBackupDue({ intervalHours: 6, lastBackupAt: hoursAgo(7) }, now)).toBe(true);
  });

  it("does not fire when the last run is in the future (clock skew)", () => {
    expect(
      isBackupDue({ intervalHours: 1, lastBackupAt: new Date(now.getTime() + 60_000) }, now),
    ).toBe(false);
  });
});

describe("nextBackupAt", () => {
  it("is null without a schedule", () => {
    expect(nextBackupAt({ intervalHours: null, lastBackupAt: null })).toBeNull();
  });

  it("adds the interval to the last run", () => {
    expect(nextBackupAt({ intervalHours: 12, lastBackupAt: hoursAgo(2) })?.toISOString()).toBe(
      "2026-11-21T22:00:00.000Z",
    );
  });
});

describe("retentionCutoff", () => {
  it("is null when retention is off", () => {
    expect(retentionCutoff(null, now)).toBeNull();
    expect(retentionCutoff(0, now)).toBeNull();
    expect(retentionCutoff(-3, now)).toBeNull();
  });

  it("subtracts the window", () => {
    expect(retentionCutoff(7, now)?.toISOString()).toBe("2026-11-14T12:00:00.000Z");
  });
});

describe("selectExpiredBackups", () => {
  const rows = [
    { id: "old", createdAt: daysAgo(10) },
    { id: "edge", createdAt: daysAgo(7) },
    { id: "new", createdAt: daysAgo(1) },
  ];

  it("removes nothing when retention is off", () => {
    expect(selectExpiredBackups(rows, null, "new")).toEqual([]);
  });

  it("keeps the newest successful backup even if it is older than the window", () => {
    const expired = selectExpiredBackups(rows, daysAgo(2), "edge");
    expect(expired.map((row) => row.id)).toEqual(["old"]);
  });

  it("removes everything outside the window when nothing has to be kept", () => {
    const expired = selectExpiredBackups(rows, daysAgo(2), null);
    expect(expired.map((row) => row.id)).toEqual(["old", "edge"]);
  });
});
