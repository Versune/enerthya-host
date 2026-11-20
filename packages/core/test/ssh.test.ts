import { describe, expect, it } from "vitest";
import { checkHostKey, hostKeyFingerprint, parseRuntimeOutput } from "../src/ssh";

describe("host key", () => {
  const key = Buffer.from("host-key-a");
  const other = Buffer.from("host-key-b");

  it("formats an OpenSSH-style SHA256 fingerprint", () => {
    expect(hostKeyFingerprint(key)).toMatch(/^SHA256:[A-Za-z0-9+/]{43}$/);
  });

  it("trusts an unpinned key on first connect and reports it", () => {
    expect(checkHostKey(key)).toEqual({ ok: true, fingerprint: hostKeyFingerprint(key) });
  });

  it("accepts the pinned key", () => {
    expect(checkHostKey(key, hostKeyFingerprint(key)).ok).toBe(true);
  });

  it("refuses a different key instead of re-pinning it", () => {
    const result = checkHostKey(other, hostKeyFingerprint(key));
    expect(result.ok).toBe(false);
    expect(result.fingerprint).toBe(hostKeyFingerprint(other));
  });
});

describe("runtime probe output", () => {
  it("reads podman", () => {
    expect(parseRuntimeOutput("podman version 5.8.6\n")).toEqual({
      runtime: "podman",
      version: "5.8.6",
    });
  });

  it("reads docker", () => {
    expect(parseRuntimeOutput("Docker version 27.3.1, build ce12230")).toEqual({
      runtime: "docker",
      version: "27.3.1",
    });
  });

  it("reports no runtime as null rather than an error", () => {
    expect(parseRuntimeOutput("none\n")).toEqual({ runtime: null, version: null });
  });
});
