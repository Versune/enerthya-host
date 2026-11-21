import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyGithubSignature } from "./webhook";

const SECRET = "0123456789abcdef";
const BODY = '{"ref":"refs/heads/main","after":"deadbeef"}';
const signature = `sha256=${createHmac("sha256", SECRET).update(BODY).digest("hex")}`;

describe("verifyGithubSignature", () => {
  it("accepts the signature GitHub would send", () => {
    expect(verifyGithubSignature(SECRET, BODY, signature)).toBe(true);
  });

  it("rejects a signature made with another secret", () => {
    const other = `sha256=${createHmac("sha256", "another-secret").update(BODY).digest("hex")}`;
    expect(verifyGithubSignature(SECRET, BODY, other)).toBe(false);
  });

  it("rejects a body that changed after signing", () => {
    expect(verifyGithubSignature(SECRET, `${BODY} `, signature)).toBe(false);
  });

  it("rejects missing, malformed and wrongly-prefixed headers", () => {
    expect(verifyGithubSignature(SECRET, BODY, null)).toBe(false);
    expect(verifyGithubSignature(SECRET, BODY, "sha1=abc")).toBe(false);
    expect(verifyGithubSignature(SECRET, BODY, "sha256=zz")).toBe(false);
  });
});
