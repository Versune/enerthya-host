import { describe, expect, it } from "vitest";
import { isAcceptableRepositoryUrl } from "./git-url";

describe("isAcceptableRepositoryUrl", () => {
  it("accepts a plain https repository", () => {
    expect(isAcceptableRepositoryUrl("https://github.com/owner/repo.git")).toBe(true);
  });

  it("accepts the ssh form that carries a username, not a secret", () => {
    expect(isAcceptableRepositoryUrl("ssh://git@github.com/owner/repo.git")).toBe(true);
  });

  it("refuses a credential embedded in an https URL", () => {
    expect(isAcceptableRepositoryUrl("https://x-access-token:ghp_secret@github.com/o/r.git")).toBe(
      false,
    );
    expect(isAcceptableRepositoryUrl("https://user@github.com/owner/repo.git")).toBe(false);
  });

  it("refuses a password on ssh", () => {
    expect(isAcceptableRepositoryUrl("ssh://git:hunter2@github.com/owner/repo.git")).toBe(false);
  });

  it("refuses the schemes that are not a remote repository", () => {
    expect(isAcceptableRepositoryUrl("file:///etc/passwd")).toBe(false);
    expect(isAcceptableRepositoryUrl("ftp://example.com/repo.git")).toBe(false);
    expect(isAcceptableRepositoryUrl("not a url")).toBe(false);
  });
});
