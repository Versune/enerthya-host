import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM for every secret at rest: SSH keys, env vars, database
 * credentials, channel config. Format: v1.<iv>.<tag>.<ciphertext>, all
 * base64url. The key comes from ENCRYPTION_KEY (32 bytes, base64 or hex) and
 * never has a fallback.
 */

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";
const HEX_KEY = /^[0-9a-f]{64}$/i;
// Standard and URL-safe base64 alphabets, with padding only at the end. Buffer
// silently skips anything else, so characters must be rejected before decoding.
const BASE64_KEY = /^[A-Za-z0-9+/_-]+={0,2}$/;

function decodeKey(raw: string | undefined): Buffer {
  if (!raw) throw new Error("ENCRYPTION_KEY is not set");
  if (HEX_KEY.test(raw)) return Buffer.from(raw, "hex");
  if (!BASE64_KEY.test(raw)) {
    throw new Error("ENCRYPTION_KEY must be base64 (32 bytes) or 64 hex characters");
  }
  const bytes = Buffer.from(raw, "base64");
  if (bytes.length !== 32) {
    throw new Error("ENCRYPTION_KEY must decode to 32 bytes (base64 or 64 hex characters)");
  }
  return bytes;
}

function key(): Buffer {
  return decodeKey(process.env.ENCRYPTION_KEY);
}

/**
 * Fails fast at boot when ENCRYPTION_KEY is missing, contains characters that
 * are not base64/hex, or does not decode to exactly 32 bytes. Encryption and
 * decryption stay lazy; panels call this during startup.
 */
export function validateEncryptionKey(): void {
  decodeKey(process.env.ENCRYPTION_KEY);
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [
    VERSION,
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  const [version, iv, tag, ciphertext] = payload.split(".");
  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error("Unsupported secret format");
  }
  const decipher = createDecipheriv(ALGORITHM, key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
