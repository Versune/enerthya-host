import { beforeEach, describe, expect, it, vi } from "vitest";

const context = vi.fn();

vi.mock("@/lib/current-org", () => ({
  currentOrganization: () => context(),
}));

const member = {
  session: { user: { id: "user_1" }, session: { activeOrganizationId: "org_1" } },
  organization: { id: "org_1", name: "Acme", slug: "acme" },
  role: "member" as const,
};

const owner = { ...member, role: "owner" as const };

const params = (id: string) => ({ params: Promise.resolve({ id }) });

/** The panel's rule: a read-only member reaches no write route. */
describe("a read-only member is refused", () => {
  beforeEach(() => context.mockReset());

  it("POST /api/servers", async () => {
    context.mockResolvedValue(member);
    const { POST } = await import("@/app/api/servers/route");
    const response = await POST(
      new Request("http://panel.test/api/servers", { method: "POST", body: "{}" }),
    );
    expect(response.status).toBe(403);
  });

  it("DELETE /api/servers/[id]", async () => {
    context.mockResolvedValue(member);
    const { DELETE } = await import("@/app/api/servers/[id]/route");
    const response = await DELETE(new Request("http://panel.test/api/servers/s1"), params("s1"));
    expect(response.status).toBe(403);
  });

  it("POST /api/servers/[id]/test — the SSH probe stays admin-only", async () => {
    context.mockResolvedValue(member);
    const { POST } = await import("@/app/api/servers/[id]/test/route");
    const response = await POST(
      new Request("http://panel.test/api/servers/s1/test", { method: "POST" }),
      params("s1"),
    );
    expect(response.status).toBe(403);
  });

  it("DELETE /api/servers/[id]/host-key", async () => {
    context.mockResolvedValue(member);
    const { DELETE } = await import("@/app/api/servers/[id]/host-key/route");
    const response = await DELETE(
      new Request("http://panel.test/api/servers/s1/host-key"),
      params("s1"),
    );
    expect(response.status).toBe(403);
  });

  it("GET /api/applications/[id]/terminal/stream", async () => {
    context.mockResolvedValue(member);
    const { GET } = await import("@/app/api/applications/[id]/terminal/stream/route");
    const response = await GET(
      new Request("http://panel.test/api/applications/a1/terminal/stream?session=s-1"),
      params("a1"),
    );
    expect(response.status).toBe(403);
  });

  it("refuses every one of them with a message the panel can show", async () => {
    context.mockResolvedValue(member);
    const { POST } = await import("@/app/api/servers/route");
    const response = await POST(
      new Request("http://panel.test/api/servers", { method: "POST", body: "{}" }),
    );
    expect(await response.json()).toEqual({ error: "Your role cannot add a server" });
  });
});

describe("the gate lets a writer through", () => {
  beforeEach(() => context.mockReset());

  it("POST /api/servers reaches validation for an owner", async () => {
    context.mockResolvedValue(owner);
    const { POST } = await import("@/app/api/servers/route");
    const response = await POST(
      new Request("http://panel.test/api/servers", { method: "POST", body: "{}" }),
    );
    expect(response.status).toBe(400);
  });

  it("the terminal stream asks for a session before touching the database", async () => {
    context.mockResolvedValue(owner);
    const { GET } = await import("@/app/api/applications/[id]/terminal/stream/route");
    const response = await GET(
      new Request("http://panel.test/api/applications/a1/terminal/stream"),
      params("a1"),
    );
    expect(response.status).toBe(400);
  });
});

describe("without a session", () => {
  beforeEach(() => context.mockReset());

  it("answers 401, not 403", async () => {
    context.mockResolvedValue(null);
    const { POST } = await import("@/app/api/servers/route");
    const response = await POST(
      new Request("http://panel.test/api/servers", { method: "POST", body: "{}" }),
    );
    expect(response.status).toBe(401);
  });
});
