import { describe, expect, it } from "vitest";
import { parseLsRemote } from "./git";

describe("parseLsRemote", () => {
  it("takes the commit from the first line", () => {
    const sha = "3f9c1a0d2b4e5f60718293a4b5c6d7e8f9012345";
    expect(parseLsRemote(`${sha}\trefs/heads/main\n`)).toBe(sha);
  });

  it("ignores blank lines and trailing output", () => {
    const sha = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    expect(parseLsRemote(`\n${sha}\trefs/heads/main\n`)).toBe(sha);
  });

  it("returns null when the branch does not exist", () => {
    expect(parseLsRemote("")).toBeNull();
    expect(parseLsRemote("\n")).toBeNull();
  });

  it("does not accept something that is not a commit", () => {
    expect(parseLsRemote("fatal: repository not found")).toBeNull();
    expect(parseLsRemote("0123456\trefs/heads/main")).toBeNull();
  });
});
