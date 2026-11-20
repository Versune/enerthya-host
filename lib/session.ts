import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { lstat, mkdir, open, readFile, rename } from "node:fs/promises";
import path from "node:path";

import { stateDir } from "@/lib/runtime";

export const SESSION_COOKIE = "enerthya_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

const KEY_FILE = "panel-session.key";

let cachedKey: Buffer | null = null;

/**
 * The signing key lives beside the account record: 0600, owned by the same
 * user, never printed and never part of the repository.
 */
async function sessionKey(): Promise<Buffer> {
  if (cachedKey) return cachedKey;

  const dir = stateDir();
  const file = path.join(dir, KEY_FILE);

  try {
    const stats = await lstat(file);
    if (!stats.isFile() || stats.isSymbolicLink()) throw new Error("panel session key is not a regular file");
    const hex = (await readFile(file, "utf8")).trim();
    if (!/^[0-9a-f]{64}$/.test(hex)) throw new Error("panel session key is malformed");
    cachedKey = Buffer.from(hex, "hex");
    return cachedKey;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  await mkdir(dir, { recursive: true, mode: 0o700 });
  const key = randomBytes(32);
  const temporary = path.join(dir, `session-${randomBytes(8).toString("hex")}`);
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(`${key.toString("hex")}\n`);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporary, file);
  cachedKey = key;
  return key;
}

function sign(data: string, key: Buffer): string {
  return createHmac("sha256", key).update(data).digest("base64url");
}

export type Session = { username: string; expiresAt: number };

export async function issueSession(username: string): Promise<string> {
  const key = await sessionKey();
  const payload = Buffer.from(
    JSON.stringify({ sub: username, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }),
  ).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

export async function readSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const key = await sessionKey();
  const expected = Buffer.from(sign(payload, key));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub?: string;
      exp?: number;
    };
    if (typeof data.sub !== "string" || typeof data.exp !== "number") return null;
    if (data.exp * 1000 < Date.now()) return null;
    return { username: data.sub, expiresAt: data.exp };
  } catch {
    return null;
  }
}

/** Cookie attributes for this install: loopback HTTP, no third-party context. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    secure: process.env.ENERTHYA_PANEL_SECURE === "1",
  };
}

/**
 * Rejects cross-origin form posts. Origin is required for state-changing
 * requests; a missing Origin is refused rather than assumed safe.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
