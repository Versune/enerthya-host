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

describe("caddyConfig follows the routes it is given", () => {
  it("a removed host is absent from the next document", () => {
    const before = caddyConfig([
      { hostname: "a.example.com", port: 3000 },
      { hostname: "b.example.com", port: 3001 },
    ]);
    const after = caddyConfig([{ hostname: "b.example.com", port: 3001 }]);
    expect(before.apps.http.servers.enerthya.routes).toHaveLength(2);
    expect(after.apps.http.servers.enerthya.routes.map((r) => r.match[0]?.host[0])).toEqual([
      "b.example.com",
    ]);
  });
});

describe("caddyConfig refuses what Caddy would reject", () => {
  it("refuses a hostname Caddy cannot match", () => {
    // A wildcard is syntax to Caddy, not a hostname; a single invalid entry
    // fails the whole /load and would block every other route.
    expect(() => caddyConfig([{ hostname: "*.example.com", port: 3000 }])).toThrow(
      /not a hostname/,
    );
    expect(() => caddyConfig([{ hostname: "example", port: 3000 }])).toThrow(/not a hostname/);
  });

  it("refuses a port outside 1–65535", () => {
    expect(() => caddyConfig([{ hostname: "app.example.com", port: 0 }])).toThrow(/not a port/);
    expect(() => caddyConfig([{ hostname: "app.example.com", port: Number.NaN }])).toThrow(
      /not a port/,
    );
  });

  it("refuses two applications claiming one host instead of picking a winner", () => {
    expect(() =>
      caddyConfig([
        { hostname: "app.example.com", port: 3000 },
        { hostname: "app.example.com", port: 3001 },
      ]),
    ).toThrow(/Two applications claim app\.example\.com/);
  });
});
