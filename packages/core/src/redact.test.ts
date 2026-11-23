import { describe, expect, it } from "vitest";
import { redactCredentials } from "./redact";

describe("redactCredentials", () => {
  it("removes a token from an https URL", () => {
    expect(redactCredentials("https://x-access-token:ghp_secret@github.com/owner/repo.git")).toBe(
      "https://github.com/owner/repo.git",
    );
  });

  it("leaves a URL without credentials alone", () => {
    expect(redactCredentials("https://github.com/owner/repo.git")).toBe(
      "https://github.com/owner/repo.git",
    );
  });

  it("leaves the scp form alone — it has no password slot", () => {
    expect(redactCredentials("git@github.com:owner/repo.git")).toBe(
      "git@github.com:owner/repo.git",
    );
  });
});
