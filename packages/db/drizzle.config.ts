import { defineConfig } from "drizzle-kit";

/**
 * `generate` reads only the schema; `migrate` and `studio` need a live database.
 * The fallback matches the development compose file added in the next stage, so
 * generating a migration on a fresh checkout needs no environment at all.
 */
const DEFAULT_URL = "postgres://enerthya:enerthya@127.0.0.1:5432/enerthya";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? DEFAULT_URL },
  strict: true,
  verbose: true,
});
