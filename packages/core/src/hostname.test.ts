import { describe, expect, it } from "vitest";
import { isValidHostname, isValidPort } from "./hostname";

describe("isValidHostname", () => {
  it("accepts ordinary hostnames", () => {
    expect(isValidHostname("app.example.com")).toBe(true);
    expect(isValidHostname("a-b.example.co")).toBe(true);
    expect(isValidHostname("104-207-90-242.sslip.io")).toBe(true);
  });

  it("refuses what Caddy would interpret rather than match", () => {
    expect(isValidHostname("*.example.com")).toBe(false);
    expect(isValidHostname("{host}")).toBe(false);
    expect(isValidHostname("Example.com")).toBe(false);
  });

  it("refuses malformed names", () => {
    expect(isValidHostname("localhost")).toBe(false);
    expect(isValidHostname("app..example.com")).toBe(false);
    expect(isValidHostname("-app.example.com")).toBe(false);
    expect(isValidHostname(`${"a".repeat(64)}.example.com`)).toBe(false);
  });
});

describe("isValidPort", () => {
  it("accepts a real port only", () => {
    expect(isValidPort(1)).toBe(true);
    expect(isValidPort(65535)).toBe(true);
    expect(isValidPort(0)).toBe(false);
    expect(isValidPort(65536)).toBe(false);
    expect(isValidPort(Number.NaN)).toBe(false);
    expect(isValidPort(80.5)).toBe(false);
  });
});
