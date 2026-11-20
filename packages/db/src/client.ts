import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * One Postgres pool per process. The web app and the worker each get their
 * own module instance, which is what we want: a request never shares a
 * transaction with a background job.
 */

export function createDb(url = databaseUrl()) {
  const sql = postgres(url, { max: 10 });
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

let cached: Database | undefined;

export function getDb(): Database {
  cached ??= createDb();
  return cached;
}
