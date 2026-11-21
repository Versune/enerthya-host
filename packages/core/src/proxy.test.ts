import { describe, expect, it } from "vitest";
import { caddyConfig } from "./proxy";

describe("caddyConfig", () => {
  it("proxies each host to the port it was published on", () => {
    const config = caddyConfig([{ hostname: "app.example.com", port: 38275 }]);
    const routes = config.apps.http.servers.enerthya.routes;
    expect(routes).toHaveLength(1);
    expect(routes[0]?.match).toEqual([{ host: ["app.example.com"] }]);
    expect(routes[0]?.handle[0]?.upstreams).toEqual([{ dial: "127.0.0.1:38275" }]);
    expect(config.apps.http.servers.enerthya.listen).toEqual([":80", ":443"]);
  });

  it("sorts by hostname so the same set always produces the same document", () => {
    const a = caddyConfig([
      { hostname: "b.example.com", port: 1 },
      { hostname: "a.example.com", port: 2 },
    ]);
    const b = caddyConfig([
      { hostname: "a.example.com", port: 2 },
      { hostname: "b.example.com", port: 1 },
    ]);
    expect(a).toEqual(b);
    expect(a.apps.http.servers.enerthya.routes.map((r) => r.match[0]?.host[0])).toEqual([
      "a.example.com",
      "b.example.com",
    ]);
  });

  it("keeps the admin endpoint and its allowed origin in the document", () => {
    const config = caddyConfig([]);
    expect(config.admin).toEqual({
      listen: "127.0.0.1:2019",
      origins: ["http://127.0.0.1:2019"],
    });
  });

  it("produces a valid empty configuration when nothing is routed yet", () => {
    const config = caddyConfig([]);
    expect(config.apps.http.servers.enerthya.routes).toEqual([]);
  });
});
