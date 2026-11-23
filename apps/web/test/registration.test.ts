import { describe, expect, it } from "vitest";
import { registrationAllowed } from "@/lib/registration";

describe("registrationAllowed", () => {
  it("lets the first account claim the install", () => {
    expect(registrationAllowed(0, false)).toBe(true);
  });

  it("closes the door once an account exists", () => {
    expect(registrationAllowed(1, false)).toBe(false);
    expect(registrationAllowed(40, false)).toBe(false);
  });

  it("opens it for an invited address", () => {
    expect(registrationAllowed(1, true)).toBe(true);
  });
});
