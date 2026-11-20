import { beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "../src/crypto";

describe("secrets", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  });

  it("round-trips a value without keeping it in the payload", () => {
    const secret = "-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n-----END-----";
    const payload = encryptSecret(secret);

    expect(payload).not.toContain("OPENSSH");
    expect(decryptSecret(payload)).toBe(secret);
  });

  it("uses a fresh IV, so the same plaintext encrypts differently", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("refuses a tampered payload", () => {
    const payload = encryptSecret("keep this");
    const [version, iv, tag, ciphertext] = payload.split(".");
    const flipped = `${version}.${iv}.${tag}.${ciphertext.slice(0, -2)}AA`;

    expect(() => decryptSecret(flipped)).toThrow();
  });

  it("fails loudly when the key is missing or the wrong length", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encryptSecret("x")).toThrow(/ENCRYPTION_KEY/);

    process.env.ENCRYPTION_KEY = Buffer.alloc(16, 1).toString("base64");
    expect(() => encryptSecret("x")).toThrow(/32 bytes/);
  });

  it("accepts a 64-character hex key", () => {
    process.env.ENCRYPTION_KEY = "a".repeat(64);
    expect(decryptSecret(encryptSecret("hex key"))).toBe("hex key");
  });
});
