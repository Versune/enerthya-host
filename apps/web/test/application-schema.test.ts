import { describe, expect, it } from "vitest";
import { applicationSchema } from "@/lib/validation/application";

const base = {
  name: "Sentinel Tickets",
  environmentId: "env_1",
  sourceType: "image" as const,
  kind: "service" as const,
  dockerImage: "ghcr.io/ralphkb/sentinel-tickets:latest",
  gitBranch: "main",
  buildType: "dockerfile" as const,
  port: 3000,
  healthcheckPath: "/",
};

describe("applicationSchema — a background service", () => {
  it("accepts a service that mounts the files it reads", () => {
    const parsed = applicationSchema.safeParse({
      ...base,
      volumes: [
        { source: "/data/enerthya/apps/app_1/config.yml", target: "/app/config.yml" },
        { source: "/data/enerthya/apps/app_1/data", target: "/app/data" },
      ],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.volumes).toHaveLength(2);
  });

  it("defaults to a web application with no mounts", () => {
    const parsed = applicationSchema.safeParse({ ...base, kind: undefined, volumes: [] });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.kind).toBe("web");
      expect(parsed.data.volumes).toEqual([]);
    }
  });

  it("refuses a relative host path", () => {
    const parsed = applicationSchema.safeParse({
      ...base,
      volumes: [{ source: "config.yml", target: "/app/config.yml" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("refuses a path that climbs out of its directory", () => {
    const parsed = applicationSchema.safeParse({
      ...base,
      volumes: [{ source: "/data/enerthya/apps/app_1/../../etc/shadow", target: "/app/x" }],
    });
    expect(parsed.success).toBe(false);
  });
});
