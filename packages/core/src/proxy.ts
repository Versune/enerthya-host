/**
 * The reverse proxy is generated from the database, never edited by hand. This
 * module turns the routes the panel knows about into Caddy's JSON config and
 * loads it through the admin API — no config file on disk to drift, no restart.
 */
export type ProxyRoute = {
  hostname: string;
  /** Host port the application's container published. */
  port: number;
};

export type CaddyConfig = {
  /** Kept in the document on purpose: /load replaces everything, so a config
   * without the admin block would move the admin endpoint back to its default
   * and lose the origin the worker is allowed to call from. */
  admin: { listen: string; origins: string[] };
  apps: {
    http: {
      servers: Record<
        string,
        {
          listen: string[];
          routes: {
            match: { host: string[] }[];
            handle: { handler: "reverse_proxy"; upstreams: { dial: string }[] }[];
            terminal: boolean;
          }[];
        }
      >;
    };
  };
};

export const PROXY_SERVER = "enerthya";
export const ADMIN_LISTEN = "127.0.0.1:2019";
export const ADMIN_ORIGIN = "http://127.0.0.1:2019";

/**
 * Deterministic by design: the same routes always produce the same document,
 * so a reload with nothing changed is a no-op instead of a diff.
 */
export function caddyConfig(routes: ProxyRoute[]): CaddyConfig {
  const sorted = [...routes].sort((a, b) => a.hostname.localeCompare(b.hostname));

  return {
    admin: { listen: ADMIN_LISTEN, origins: [ADMIN_ORIGIN] },
    apps: {
      http: {
        servers: {
          [PROXY_SERVER]: {
            listen: [":80", ":443"],
            routes: sorted.map((route) => ({
              match: [{ host: [route.hostname] }],
              handle: [
                {
                  handler: "reverse_proxy" as const,
                  upstreams: [{ dial: `127.0.0.1:${route.port}` }],
                },
              ],
              terminal: true,
            })),
          },
        },
      },
    },
  };
}

/** Sends the whole config to Caddy's admin API, replacing what was there. */
export async function publishRoutes(adminUrl: string, routes: ProxyRoute[]): Promise<void> {
  const base = adminUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/load`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Caddy's admin endpoint checks the request origin. Node's fetch sends
      // browser-ish request headers, so the check runs and needs a real origin
      // from the allowed list rather than the empty one it would otherwise see.
      origin: base,
    },
    body: JSON.stringify(caddyConfig(routes)),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(
      `The proxy refused the configuration (${response.status}): ${(await response.text()).slice(0, 200)}`,
    );
  }
}
