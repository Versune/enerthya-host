import { access } from "node:fs/promises";
import Docker from "dockerode";
import tar from "tar-fs";

/**
 * The worker talks to a Docker-compatible API. Docker and Podman both serve
 * it, so the same code drives either; the only difference is where the socket
 * lives and what the error message calls it.
 */
export type RuntimeKind = "docker" | "podman";

export type RuntimeConnection = {
  client: Docker;
  address: string;
  kind: RuntimeKind;
};

export type CreateContainerSpec = {
  name: string;
  image: string;
  containerPort: number;
  labels: Record<string, string>;
};

function parseDockerHost(value: string): Docker.DockerOptions | null {
  if (value.startsWith("unix://")) {
    const socketPath = value.slice("unix://".length);
    return socketPath ? { socketPath } : null;
  }
  if (value.startsWith("tcp://") || value.startsWith("http://")) {
    const url = new URL(value.replace(/^tcp:/, "http:"));
    return { host: url.hostname, port: Number(url.port || 2375) };
  }
  return null;
}

export function describeRuntime(options: Docker.DockerOptions): {
  address: string;
  kind: RuntimeKind;
} {
  if (options.socketPath) {
    return {
      address: options.socketPath,
      kind: options.socketPath.includes("podman") ? "podman" : "docker",
    };
  }
  return { address: `${options.host}:${options.port}`, kind: "docker" };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Candidate sockets in the order they are tried when DOCKER_HOST is unset.
 * The rootless Podman socket is included because that is what a developer on
 * a workstation has; the system Docker socket is what a server has.
 */
async function defaultCandidates(env: NodeJS.ProcessEnv): Promise<Docker.DockerOptions[]> {
  const runtimeDir = env.XDG_RUNTIME_DIR ?? `/run/user/${process.getuid?.() ?? 1000}`;
  const paths = [
    "/var/run/docker.sock",
    `${runtimeDir}/podman/podman.sock`,
    "/run/podman/podman.sock",
  ];
  const candidates: Docker.DockerOptions[] = [];
  for (const path of paths) {
    if (await exists(path)) candidates.push({ socketPath: path });
  }
  return candidates;
}

export async function connectRuntime(
  env: NodeJS.ProcessEnv = process.env,
): Promise<RuntimeConnection | null> {
  let candidates: Docker.DockerOptions[];
  if (env.DOCKER_HOST) {
    const parsed = parseDockerHost(env.DOCKER_HOST);
    if (!parsed) {
      throw new Error(`DOCKER_HOST must be a unix:// or tcp:// address, not ${env.DOCKER_HOST}`);
    }
    candidates = [parsed];
  } else {
    candidates = await defaultCandidates(env);
  }

  for (const options of candidates) {
    const client = new Docker(options);
    try {
      await client.ping();
      return { client, ...describeRuntime(options) };
    } catch {
      // Try the next socket. A dead one is not an error until none answer.
    }
  }
  return null;
}

export function missingRuntimeMessage(): string {
  return "No container runtime answered. Set DOCKER_HOST to the Docker socket, or start the Podman API service (podman system service --time 0).";
}

export async function pullImage(client: Docker, reference: string): Promise<void> {
  const stream = await client.pull(reference);
  await new Promise<void>((resolve, reject) => {
    client.modem.followProgress(stream, (error: Error | null) => {
      if (error) reject(new Error(`Could not pull ${reference}: ${error.message}`));
      else resolve();
    });
  });
}

export async function buildImage(
  client: Docker,
  contextDir: string,
  tag: string,
  dockerfile = "Dockerfile",
): Promise<void> {
  const context = tar.pack(contextDir, {
    ignore: (name) => name === ".git" || name.startsWith(".git/"),
  });
  const stream = await client.buildImage(context, { t: tag, dockerfile });
  await new Promise<void>((resolve, reject) => {
    client.modem.followProgress(
      stream,
      (error: Error | null) => {
        if (error) reject(new Error(`The build failed: ${error.message}`));
        else resolve();
      },
      (event: { error?: string }) => {
        if (event.error) reject(new Error(`The build failed: ${event.error}`));
      },
    );
  });
}

export async function createAndStart(
  client: Docker,
  spec: CreateContainerSpec,
): Promise<{ id: string; hostPort: number }> {
  const portKey = `${spec.containerPort}/tcp`;
  const container = await client.createContainer({
    name: spec.name,
    Image: spec.image,
    Labels: spec.labels,
    ExposedPorts: { [portKey]: {} },
    HostConfig: {
      PortBindings: { [portKey]: [{ HostPort: "" }] },
      RestartPolicy: { Name: "unless-stopped" },
    },
  });

  await container.start();

  const info = await container.inspect();
  const binding = info.NetworkSettings.Ports?.[portKey]?.[0];
  const hostPort = binding?.HostPort ? Number(binding.HostPort) : Number.NaN;
  if (!Number.isInteger(hostPort)) {
    throw new Error(
      `The runtime started ${spec.name} but did not publish port ${spec.containerPort}`,
    );
  }
  return { id: container.id, hostPort };
}

export async function stopAndRemove(client: Docker, id: string): Promise<void> {
  const container = client.getContainer(id);
  try {
    await container.stop({ t: 10 });
  } catch {
    // Already stopped.
  }
  try {
    await container.remove({ force: true });
  } catch {
    // Already gone.
  }
}

export async function listApplicationContainers(
  client: Docker,
  applicationId: string,
): Promise<{ id: string; state: string }[]> {
  const containers = await client.listContainers({
    all: true,
    filters: { label: [`enerthya.application=${applicationId}`] },
  });
  return containers.map((container) => ({ id: container.Id, state: container.State }));
}

/** Polls a URL until it answers below 500 or the deadline passes. */
export async function waitForHealthy(
  url: string,
  { timeoutMs = 60_000, intervalMs = 2_000 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last = "no response";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3_000) });
      if (response.status < 500) return;
      last = `HTTP ${response.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : "unreachable";
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`The health check at ${url} did not pass within 60s (last: ${last}).`);
}

export function containerName(slug: string, deploymentId: string): string {
  const safe = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `enerthya-${safe || "app"}-${deploymentId.slice(0, 8)}`;
}
