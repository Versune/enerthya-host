import type { NextConfig } from "next";

/**
 * The panel is a Node application: its API routes are the only thing allowed to
 * touch the deployment, and they do it by calling the same CLI the operator
 * uses. `standalone` produces the self-contained server the installer ships.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
