import { resolve } from "node:path";
import type { NextConfig } from "next";

/**
 * The web app is a thin dashboard: pages, forms and route handlers that hand
 * work to the worker. Builds, deploys, backups and log streams never run in a
 * Next request.
 *
 * `outputFileTracingRoot` points at the workspace root so the standalone
 * bundle carries the hoisted dependencies it actually imports.
 */
const isDev = process.env.NODE_ENV === "development";

/**
 * The panel is served from one origin and never loads third-party assets, so
 * the policy can stay strict. `connect-src ws: wss:` keeps the deploy log SSE
 * stream and the web terminal socket working; React's dev-only `eval` debugging
 * is the sole reason for `'unsafe-eval'`, which production never gets.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' ws: wss:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: resolve(process.cwd(), "../.."),
  transpilePackages: ["@enerthya/ui", "@enerthya/db", "@enerthya/core"],
  // ssh2 ships a native addon; it has to stay a runtime require instead of
  // being placed into a server chunk.
  serverExternalPackages: ["ssh2", "cpu-features"],
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
