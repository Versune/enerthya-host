import { defineConfig, devices } from "@playwright/test";

// Next 16's dev server treats 127.0.0.1 as a cross-origin dev client and refuses
// the HMR socket, which leaves the page unhydrated. localhost is the origin it
// advertises, so tests use the same one a developer does.
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next dev -p ${PORT}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      // better-auth refuses to start without a secret. The suite expects a
      // migrated database (see the e2e job in CI, or `pnpm db:migrate` locally).
      BETTER_AUTH_SECRET: "e2e-secret-not-used-anywhere-else-0123456789",
      BETTER_AUTH_URL: baseURL,
      DATABASE_URL: "postgres://enerthya:enerthya@127.0.0.1:5432/enerthya",
    },
  },
});
