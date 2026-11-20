import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { lstat, mkdir, open, readFile, rename } from "node:fs/promises";
import path from "node:path";

/**
 * One administrator per install, stored on this machine.
 *
 * The record holds a salt, the scrypt parameters and the derived digest — never
 * the password, never a plaintext copy, never a recovery channel.
 */

export const RECORD = "panel-account.json";
export const MIN_PASSWORD = 12;

const PARAMS = { N: 2 ** 15, r: 8, p: 1, dklen: 32 };
const MAX_MEMORY = 128 * 1024 * 1024;
const USERNAME = /^[a-z0-9][a-z0-9_.-]{2,31}$/;

export class PanelError extends Error {}

export function stateDir(): string {
  return path.resolve(process.env.ENERTHYA_STATE_DIR || ".enerthya-state");
}

function recordPath(): string {
  return path.join(stateDir(), RECORD);
}

export function normaliseUsername(username: string): string {
  return (username || "").trim().toLowerCase();
}

function checkUsername(username: string): string {
  const normalised = normaliseUsername(username);
  if (!USERNAME.test(normalised)) {
    throw new PanelError(
      "Username must be 3-32 characters: lowercase letters, digits, dot, dash or underscore, starting with a letter or digit",
    );
  }
  return normalised;
}

function checkPassword(password: string): string {
  if (typeof password !== "string" || password.length < MIN_PASSWORD) {
    throw new PanelError(`Password must be at least ${MIN_PASSWORD} characters`);
  }
  if (Buffer.byteLength(password, "utf8") > 1024) throw new PanelError("Password is too long");
  if (password.includes("\0")) throw new PanelError("Password contains a NUL byte");
  return password;
}

function derive(password: string, salt: Buffer, params: typeof PARAMS): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      params.dklen,
      { N: params.N, r: params.r, p: params.p, maxmem: MAX_MEMORY },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

export type StoredAccount = {
  version: number;
  username: string;
  salt: string;
  digest: string;
  params: { N: number; r: number; p: number; dklen: number };
  createdAt: string;
};

export async function loadAccount(): Promise<StoredAccount | null> {
  const file = recordPath();
  try {
    const stats = await lstat(file);
    if (!stats.isFile() || stats.isSymbolicLink()) throw new PanelError("Account record is not a regular file");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(file, "utf8"));
  } catch {
    throw new PanelError("Account record is unreadable");
  }

  const record = parsed as Partial<StoredAccount>;
  if (
    !record ||
    record.version !== 1 ||
    typeof record.username !== "string" ||
    typeof record.salt !== "string" ||
    typeof record.digest !== "string" ||
    !record.params
  ) {
    throw new PanelError("Account record is not in a supported format");
  }
  return record as StoredAccount;
}

export async function accountExists(): Promise<boolean> {
  return (await loadAccount()) !== null;
}

export async function createAccount(username: string, password: string) {
  const normalised = checkUsername(username);
  checkPassword(password);

  if (await accountExists()) {
    throw new PanelError("An administrator already exists; reset it from the install directory to replace it");
  }

  await mkdir(stateDir(), { recursive: true, mode: 0o700 });

  const salt = randomBytes(16);
  const digest = await derive(password, salt, PARAMS);
  const record: StoredAccount = {
    version: 1,
    username: normalised,
    salt: salt.toString("hex"),
    digest: digest.toString("hex"),
    params: PARAMS,
    createdAt: new Date().toISOString(),
  };

  const temporary = path.join(stateDir(), `account-${randomBytes(8).toString("hex")}`);
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(record, null, 2)}\n`);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporary, recordPath());

  return { username: normalised, createdAt: record.createdAt };
}

export async function verifyPassword(username: string, password: string): Promise<boolean> {
  const normalised = normaliseUsername(username);
  let record: StoredAccount | null;
  try {
    record = await loadAccount();
  } catch {
    record = null;
  }

  if (!record) {
    // Spend the same work as a real check: a missing install and a wrong
    // password must not be distinguishable by timing.
    await derive(password || "", randomBytes(16), PARAMS);
    return false;
  }

  const derived = await derive(password || "", Buffer.from(record.salt, "hex"), record.params);
  const expected = Buffer.from(record.digest, "hex");
  const sameUser = timingSafeEqual(Buffer.from(record.username), Buffer.from(normalised));
  return sameUser && derived.length === expected.length && timingSafeEqual(derived, expected);
}

export async function resetAccount(): Promise<boolean> {
  try {
    const file = recordPath();
    await lstat(file);
    const { unlink } = await import("node:fs/promises");
    await unlink(file);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}
