import { access } from "node:fs/promises";
import { Writable } from "node:stream";
import Docker from "dockerode";
import tar from "tar-fs";
import type { ContainerStatsPayload } from "./stats";

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
  /** KEY=value pairs handed to the container. */
  env?: string[];
  /** Host paths or named volumes mounted into the container. */
  volumes?: { source: string; target: string }[];
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
  buildArgs: Record<string, string> = {},
): Promise<void> {
  const context = tar.pack(contextDir, {
    ignore: (name) => name === ".git" || name.startsWith(".git/"),
  });
  const stream = await client.buildImage(context, { t: tag, dockerfile, buildargs: buildArgs });
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
    Env: spec.env,
    ExposedPorts: { [portKey]: {} },
    HostConfig: {
      PortBindings: { [portKey]: [{ HostPort: "" }] },
      RestartPolicy: { Name: "unless-stopped" },
      Binds: spec.volumes?.map((volume) => `${volume.source}:${volume.target}`),
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

export async function readContainerStats(
  client: Docker,
  containerId: string,
): Promise<ContainerStatsPayload> {
  const container = client.getContainer(containerId);
  return (await container.stats({ stream: false })) as unknown as ContainerStatsPayload;
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

/**
 * Follows a container's output. Each complete line goes to `onLine`; the
 * returned function stops the stream. Logs arrive multiplexed (stdout/stderr),
 * so demuxStream is what turns them into text.
 */
export function streamContainerLogs(
  client: Docker,
  containerId: string,
  onLine: (line: string) => void,
  { tail = 200 }: { tail?: number } = {},
): () => void {
  const container = client.getContainer(containerId);
  let pending = "";
  let opened: { destroy?: () => void } | null = null;
  let stopped = false;

  const sink = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      pending += chunk.toString("utf8");
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) {
        if (!stopped && line.trim()) onLine(line.slice(0, 4000));
      }
      callback();
    },
  });

  container
    .logs({ follow: true, stdout: true, stderr: true, tail })
    .then((stream) => {
      opened = stream as unknown as { destroy?: () => void };
      client.modem.demuxStream(stream, sink, sink);
    })
    .catch((error: Error) => {
      if (!stopped) onLine(`[enerthya] could not read the container log: ${error.message}`);
    });

  return () => {
    stopped = true;
    try {
      opened?.destroy?.();
    } catch {
      // The container may have gone away first.
    }
  };
}

export async function ensureVolume(client: Docker, name: string): Promise<void> {
  try {
    await client.createVolume({ Name: name });
  } catch (error) {
    // An existing volume is the normal case when a provisioning job is retried.
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) throw error;
  }
}

export async function removeVolume(client: Docker, name: string): Promise<void> {
  try {
    await client.getVolume(name).remove();
  } catch {
    // A missing volume is already removed.
  }
}

/** Runs a command inside a container and returns its exit code. */
export async function execInContainer(
  client: Docker,
  containerId: string,
  command: string[],
): Promise<number> {
  const container = client.getContainer(containerId);
  const exec = await container.exec({
    Cmd: command,
    AttachStdout: true,
    AttachStderr: true,
  });
  const started = await exec.start({});
  await new Promise<void>((resolve) => {
    started.on("end", () => resolve());
    started.on("error", () => resolve());
    started.resume();
  });
  const info = await exec.inspect();
  return info.ExitCode ?? 1;
}

export type TerminalSession = {
  write: (data: string) => void;
  resize: (cols: number, rows: number) => Promise<void>;
  close: () => void;
};

/**
 * A TTY attached to a shell inside the container.
 *
 * Tty:true means Docker sends the raw byte stream with no 8-byte framing, so
 * the terminal gets what the shell wrote and can write keystrokes straight
 * back. No demuxStream here for the same reason the capture path needs it.
 */
export async function openTerminal(
  client: Docker,
  containerId: string,
  options: {
    cols: number;
    rows: number;
    shell?: string[];
    onData: (chunk: string) => void;
    onExit?: () => void;
  },
): Promise<TerminalSession> {
  const container = client.getContainer(containerId);
  const exec = await container.exec({
    Cmd: options.shell ?? ["/bin/sh"],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
  });
  const stream = await exec.start({ hijack: true, stdin: true });

  stream.on("data", (chunk: Buffer) => options.onData(chunk.toString("utf8")));
  stream.on("end", () => options.onExit?.());
  stream.on("error", () => options.onExit?.());

  await exec.resize({ h: options.rows, w: options.cols }).catch(() => undefined);

  return {
    write(data: string) {
      stream.write(data);
    },
    async resize(cols: number, rows: number) {
      await exec.resize({ h: rows, w: cols }).catch(() => undefined);
    },
    close() {
      stream.end();
      stream.destroy();
    },
  };
}

/** Runs a command and returns its exit code and raw output. */
export async function execCapture(
  client: Docker,
  containerId: string,
  command: string[],
  { maxBytes = 256 * 1024 * 1024 }: { maxBytes?: number } = {},
): Promise<{ code: number; output: Buffer }> {
  const container = client.getContainer(containerId);
  const exec = await container.exec({
    Cmd: command,
    AttachStdout: true,
    AttachStderr: true,
  });
  // hijack + demuxStream: without them a non-TTY exec delivers Docker's 8-byte
  // frame headers mixed into the output, which a binary dump cannot survive.
  const stream = await exec.start({ hijack: true, stdin: false });
  const chunks: Buffer[] = [];
  let size = 0;

  const sink = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      size += chunk.length;
      if (size > maxBytes) {
        callback(new Error("The command produced more output than this operation accepts."));
        return;
      }
      chunks.push(chunk);
      callback();
    },
  });
  client.modem.demuxStream(stream, sink, sink);

  await new Promise<void>((resolve, reject) => {
    stream.on("end", () => resolve());
    stream.on("close", () => resolve());
    stream.on("error", reject);
    sink.on("error", reject);
  });

  const info = await exec.inspect();
  return { code: info.ExitCode ?? 1, output: Buffer.concat(chunks) };
}
