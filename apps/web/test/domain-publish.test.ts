import { beforeEach, describe, expect, it, vi } from "vitest";

const context = vi.fn();
const notifyChannel = vi.fn(async () => undefined);
const addDomain = vi.fn(async () => undefined);
const removeDomain = vi.fn(async () => true);

vi.mock("@/lib/current-org", () => ({ currentOrganization: () => context() }));
vi.mock("@enerthya/db", () => ({ getDb: () => ({}), notifyChannel }));
vi.mock("@/lib/domains", () => ({ addDomain, removeDomain }));

const owner = {
  session: { user: { id: "user_1" }, session: { activeOrganizationId: "org_1" } },
  organization: { id: "org_1", name: "Acme", slug: "acme" },
  role: "owner" as const,
};

const params = <T extends Record<string, string>>(values: T) => ({
  params: Promise.resolve(values),
});

describe("a domain change asks the worker to republish", () => {
  beforeEach(() => {
    context.mockReset();
    notifyChannel.mockClear();
    addDomain.mockClear();
    removeDomain.mockClear();
    context.mockResolvedValue(owner);
  });

  it("publishes after adding a host", async () => {
    const { POST } = await import("@/app/api/applications/[id]/domains/route");
    const response = await POST(
      new Request("http://panel.test/api/applications/app_1/domains", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hostname: "app.example.com" }),
      }),
      params({ id: "app_1" }),
    );
    expect(response.status).toBe(201);
    expect(notifyChannel).toHaveBeenCalledWith(expect.anything(), "proxy_publish", "{}");
  });

  it("publishes after removing a host — otherwise it keeps routing", async () => {
    const { DELETE } = await import("@/app/api/applications/[id]/domains/[domainId]/route");
    const response = await DELETE(
      new Request("http://panel.test/api/applications/app_1/domains/dom_1", { method: "DELETE" }),
      params({ id: "app_1", domainId: "dom_1" }),
    );
    expect(response.status).toBe(204);
    expect(notifyChannel).toHaveBeenCalledWith(expect.anything(), "proxy_publish", "{}");
  });

  it("does not ask for a publish when nothing was removed", async () => {
    removeDomain.mockResolvedValueOnce(false);
    const { DELETE } = await import("@/app/api/applications/[id]/domains/[domainId]/route");
    const response = await DELETE(
      new Request("http://panel.test/api/applications/app_1/domains/dom_404", { method: "DELETE" }),
      params({ id: "app_1", domainId: "dom_404" }),
    );
    expect(response.status).toBe(404);
    expect(notifyChannel).not.toHaveBeenCalled();
  });
});
