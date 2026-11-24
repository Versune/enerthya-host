import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
const transitions: Array<{ from: string[]; to: string }> = [];

const target = {
  deploymentId: "dep_1",
  applicationId: "app_1",
  applicationName: "storefront",
  applicationSlug: "storefront",
  environmentId: "env_1",
  sourceType: "image" as const,
  kind: "web" as const,
  volumes: null,
  gitUrl: null,
  gitBranch: "main",
  dockerImage: "nginx:1.28-alpine",
  buildType: "dockerfile" as const,
  port: 3000,
  healthcheckPath: "/",
  presetImage: "nginx:1.28-alpine",
  deployKeyEncrypted: null,
};

const publishRoutes = vi.fn();
const stopAndRemove = vi.fn(async (_client: unknown, id: string) => {
  calls.push(`stop:${id}`);
});

vi.mock("@enerthya/core/proxy", () => ({
  publishRoutes: (...args: unknown[]) => publishRoutes(...args),
}));

vi.mock("@enerthya/core/runtime", () => ({
  connectRuntime: async () => ({
    kind: "docker",
    address: "/var/run/docker.sock",
    client: { getContainer: () => ({ inspect: async () => null }) },
  }),
  containerName: (slug: string, id: string) => `enerthya-${slug}-${id}`,
  createAndStart: async () => {
    calls.push("create");
    return { id: "new-container", hostPort: 8080 };
  },
  imageExists: async () => true,
  listApplicationContainers: async () => [{ id: "old-container", state: "running" }],
  missingRuntimeMessage: () => "no runtime",
  stopAndRemove: (client: unknown, id: string) => stopAndRemove(client, id),
  waitForHealthy: async () => {
    calls.push("healthy");
  },
}));

vi.mock("@enerthya/db", () => ({
  getDb: () => ({}),
  selectDeploymentTarget: async () => target,
  selectSteps: async () => [],
  selectEncryptedEnvVars: async () => [],
  transitionDeployment: async (_db: unknown, _id: string, from: string[], to: string) => {
    transitions.push({ from, to });
    calls.push(`transition:${to}`);
    return true;
  },
  appendDeploymentLog: async () => undefined,
  recordStep: async (_db: unknown, _id: string, name: string) => {
    calls.push(`step:${name}`);
  },
  setDeploymentRuntime: async () => undefined,
  applicationHasDomains: async () => true,
  selectDomainRoutes: async () => [{ hostname: "storefront.example", port: 8080 }],
  withApplicationLock: async (_db: unknown, _app: string, run: () => Promise<unknown>) => ({
    locked: true as const,
    value: await run(),
  }),
  withAdvisoryLock: async (_db: unknown, _key: string, run: () => Promise<unknown>) => ({
    locked: true as const,
    value: await run(),
  }),
}));

vi.mock("./notify", () => ({ notifyFailure: async () => undefined }));
vi.mock("./naming", () => ({ imageTagFor: (slug: string, id: string) => `${slug}:${id}` }));

const { runDeployment } = await import("./deploy");

describe("runDeployment — the swap", () => {
  beforeEach(() => {
    calls.length = 0;
    transitions.length = 0;
    publishRoutes.mockReset();
    stopAndRemove.mockClear();
    process.env.CADDY_ADMIN_URL = "http://127.0.0.1:2019";
  });

  it("publishes the route before stopping the previous container", async () => {
    publishRoutes.mockResolvedValue(undefined);
    await runDeployment("dep_1");

    const published = calls.indexOf("transition:running");
    const stoppedOld = calls.indexOf("stop:old-container");
    expect(published).toBeGreaterThanOrEqual(0);
    expect(stoppedOld).toBeGreaterThan(published);
    expect(calls).not.toContain("stop:new-container");
    // the swap is recorded before the old container is touched
    expect(calls.indexOf("step:swap")).toBeLessThan(calls.indexOf("stop:old-container"));
  });

  it("keeps the previous container when the proxy refuses the new route", async () => {
    publishRoutes
      .mockRejectedValueOnce(new Error("caddy said no"))
      .mockResolvedValueOnce(undefined);

    await runDeployment("dep_1");

    expect(calls).toContain("stop:new-container");
    expect(calls).not.toContain("stop:old-container");
    // first attempt fails, the failure handler republishes the old routes
    expect(publishRoutes).toHaveBeenCalledTimes(2);
    const failed = transitions.some((t) => t.to === "failed");
    expect(failed).toBe(true);
  });

  it("stops before the container when the row was taken by another run", async () => {
    // The row left `building` while this run was working: it must not create
    // a container it would then have to guess the owner of.
    const db = await import("@enerthya/db");
    const spy = vi
      .spyOn(db, "transitionDeployment")
      .mockImplementation(async (_db, _id, from: string[], to: string) => {
        transitions.push({ from, to });
        calls.push(`transition:${to}`);
        return to !== "deploying";
      });

    publishRoutes.mockResolvedValue(undefined);
    await runDeployment("dep_1");

    expect(calls).not.toContain("create");
    expect(transitions.some((t) => t.to === "failed")).toBe(true);
    spy.mockRestore();
  });
});
