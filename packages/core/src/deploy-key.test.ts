import { describe, expect, it } from "vitest";
import { generateDeployKey, publicKeyFromPrivate } from "./deploy-key";

describe("deploy keys", () => {
  it("generates an OpenSSH private key and its public half", () => {
    const key = generateDeployKey("app");
    expect(key.privateKey).toContain("BEGIN OPENSSH PRIVATE KEY");
    expect(key.publicKey).toMatch(/^ssh-ed25519 [A-Za-z0-9+/=]+ app$/);
  });

  it("rebuilds the same public key from the private one", () => {
    const key = generateDeployKey("app");
    expect(publicKeyFromPrivate(key.privateKey, "app")).toBe(key.publicKey);
  });

  it("returns null for something that is not a key", () => {
    expect(publicKeyFromPrivate("not a key")).toBeNull();
  });
});
