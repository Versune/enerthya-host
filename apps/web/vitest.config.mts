import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Route handlers are plain functions, so they can be exercised with the
 * session layer mocked instead of a browser. The "@" alias mirrors tsconfig.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    server: { deps: { inline: [/@enerthya\//] } },
  },
});
