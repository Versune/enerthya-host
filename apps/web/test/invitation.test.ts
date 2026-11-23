import { describe, expect, it } from "vitest";
import { invitationAcceptable } from "@/lib/members";

const now = new Date("2026-11-23T12:00:00Z");

describe("invitationAcceptable", () => {
  it("accepts a pending invitation inside its window", () => {
    expect(
      invitationAcceptable({ status: "pending", expiresAt: new Date("2026-11-24T12:00:00Z") }, now),
    ).toBe(true);
  });

  it("refuses an expired invitation even while pending", () => {
    expect(
      invitationAcceptable({ status: "pending", expiresAt: new Date("2026-11-22T12:00:00Z") }, now),
    ).toBe(false);
  });

  it("refuses one that was already accepted or cancelled", () => {
    const future = new Date("2026-11-24T12:00:00Z");
    expect(invitationAcceptable({ status: "accepted", expiresAt: future }, now)).toBe(false);
    expect(invitationAcceptable({ status: "canceled", expiresAt: future }, now)).toBe(false);
  });
});
