import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { containerName, describeRuntime, isHealthy, portBindings, waitForHealthy } from "./runtime";

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

describe("portBindings", () => {
  it("binds every published port to loopback", () => {
    // A public binding would let the container be reached without TLS, past
    // the proxy that dials 127.0.0.1.
    expect(portBindings(3000)).toEqual({
      "3000/tcp": [{ HostIp: "127.0.0.1", HostPort: "" }],
    });
  });
});

describe("isHealthy", () => {
  it("accepts only 2xx", () => {
    expect(isHealthy(200)).toBe(true);
    expect(isHealthy(204)).toBe(true);
    expect(isHealthy(301)).toBe(false);
    expect(isHealthy(404)).toBe(false);
    expect(isHealthy(500)).toBe(false);
  });
});

describe("waitForHealthy", () => {
  const withServer = async (
    handler: (request: IncomingMessage, response: ServerResponse) => void,
    run: (url: string) => Promise<void>,
  ) => {
    const server = createServer(handler);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    try {
      await run(`http://127.0.0.1:${port}/`);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  };

  it("keeps polling a 404 and passes on the first 200", async () => {
    let hits = 0;
    await withServer(
      (_request, response) => {
        hits += 1;
        response.writeHead(hits === 1 ? 404 : 200).end("ok");
      },
      async (url) => {
        await waitForHealthy(url, { timeoutMs: 3_000, intervalMs: 20 });
      },
    );
    expect(hits).toBe(2);
  });

  it("does not follow a redirect to some other page", async () => {
    await withServer(
      (_request, response) => {
        response.writeHead(302, { location: "/sign-in" }).end();
      },
      async (url) => {
        await expect(waitForHealthy(url, { timeoutMs: 400, intervalMs: 50 })).rejects.toThrow(
          "HTTP 302",
        );
      },
    );
  });

  it("names the timeout it was given", async () => {
    await withServer(
      (_request, response) => {
        response.writeHead(500).end();
      },
      async (url) => {
        await expect(waitForHealthy(url, { timeoutMs: 1_200, intervalMs: 50 })).rejects.toThrow(
          "did not pass within 1s",
        );
      },
    );
  });
});
