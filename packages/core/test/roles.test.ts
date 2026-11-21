import { describe, expect, it } from "vitest";
import { roleAtLeast } from "../src/roles";

describe("role hierarchy", () => {
  it("lets an owner do anything", () => {
    expect(roleAtLeast("owner", "owner")).toBe(true);
    expect(roleAtLeast("owner", "admin")).toBe(true);
    expect(roleAtLeast("owner", "member")).toBe(true);
  });

  it("lets an admin write but not own", () => {
    expect(roleAtLeast("admin", "admin")).toBe(true);
    expect(roleAtLeast("admin", "owner")).toBe(false);
  });

  it("keeps a member read-only", () => {
    expect(roleAtLeast("member", "member")).toBe(true);
    expect(roleAtLeast("member", "admin")).toBe(false);
  });
});
