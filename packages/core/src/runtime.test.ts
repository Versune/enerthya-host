import { describe, expect, it } from "vitest";
import { containerName, describeRuntime } from "./runtime";

describe("describeRuntime", () => {
  it("names a Unix socket and tells Podman from Docker", () => {
    expect(describeRuntime({ socketPath: "/var/run/docker.sock" })).toEqual({
      address: "/var/run/docker.sock",
      kind: "docker",
    });
    expect(describeRuntime({ socketPath: "/run/user/1000/podman/podman.sock" })).toEqual({
      address: "/run/user/1000/podman/podman.sock",
      kind: "podman",
    });
  });

  it("names a TCP endpoint", () => {
    expect(describeRuntime({ host: "10.0.0.5", port: 2375 })).toEqual({
      address: "10.0.0.5:2375",
      kind: "docker",
    });
  });
});

describe("containerName", () => {
  it("builds a stable name from the slug and the deployment", () => {
    expect(containerName("my-app", "12345678-90ab-cdef-1234-567890abcdef")).toBe(
      "enerthya-my-app-12345678",
    );
  });

  it("keeps the name legal when the slug is not", () => {
    expect(containerName("App__With Spaces", "abcdefgh-0000")).toBe(
      "enerthya-app-with-spaces-abcdefgh",
    );
    expect(containerName("!!!", "abcdefgh-0000")).toBe("enerthya-app-abcdefgh");
  });

  it("does not exceed the length a container name tolerates", () => {
    const name = containerName("x".repeat(120), "abcdefgh-0000");
    expect(name.length).toBeLessThanOrEqual(58);
  });
});
