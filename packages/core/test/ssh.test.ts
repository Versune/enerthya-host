import { describe, expect, it } from "vitest";
import { parseRuntimeOutput } from "../src/ssh";

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
