import { describe, expect, it } from "vitest";
import { toSlug } from "../src/slug";

describe("toSlug", () => {
  it("lowercases and hyphenates words", () => {
    expect(toSlug("My First App")).toBe("my-first-app");
  });

  it("strips accents instead of dropping the letter", () => {
    expect(toSlug("Produção")).toBe("producao");
  });

  it("collapses punctuation into single hyphens", () => {
    expect(toSlug("api.v2//edge___worker")).toBe("api-v2-edge-worker");
  });

  it("trims leading and trailing separators", () => {
    expect(toSlug("--hello--")).toBe("hello");
  });

  it("caps the length without leaving a trailing hyphen", () => {
    const slug = toSlug(`${"a".repeat(47)} b`);
    expect(slug).toHaveLength(47);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("returns an empty string when nothing usable remains", () => {
    expect(toSlug("···")).toBe("");
  });
});
