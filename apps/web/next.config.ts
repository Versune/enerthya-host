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
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: resolve(process.cwd(), "../.."),
  transpilePackages: ["@enerthya/ui", "@enerthya/db"],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
