import { defineConfig, devices } from "@playwright/test";

// Next 16's dev server treats 127.0.0.1 as a cross-origin dev client and refuses
// the HMR socket, which leaves the page unhydrated. localhost is the origin it
// advertises, so tests use the same one a developer does.
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
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
      ENERTHYA_STATE_DIR: "./e2e/.state",
      // better-auth refuses to start without a secret. The database is only
      // opened by requests that read or write a session.
      BETTER_AUTH_SECRET: "e2e-secret-not-used-anywhere-else-0123456789",
      BETTER_AUTH_URL: baseURL,
      DATABASE_URL: "postgres://enerthya:enerthya@127.0.0.1:5432/enerthya",
    },
  },
});
