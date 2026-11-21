import { describe, expect, it } from "vitest";
import { imageTagFor } from "./naming";

describe("imageTagFor", () => {
  it("names the image after the application and the deployment", () => {
    expect(imageTagFor("my-app", "12345678-90ab-cdef")).toBe("enerthya/my-app:12345678-90a");
  });

  it("normalises a slug that is not a legal image name", () => {
    expect(imageTagFor("App__With Spaces", "abcdefgh-0000")).toBe(
      "enerthya/app-with-spaces:abcdefgh-000",
    );
  });

  it("falls back when the slug has nothing usable", () => {
    expect(imageTagFor("!!!", "abcdefgh-0000")).toBe("enerthya/app:abcdefgh-000");
  });
});
