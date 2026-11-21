import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * GitHub signs the raw request body with HMAC-SHA256 and sends
 * `sha256=<hex>` in X-Hub-Signature-256. Comparing in constant time keeps the
 * check from leaking how much of a forged signature was right.
 */
export function verifyGithubSignature(
  secret: string,
  payload: string,
  header: string | null,
): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(payload, "utf8").digest();
  const received = Buffer.from(header.slice("sha256=".length), "hex");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}
