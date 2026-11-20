import { Client } from "ssh2";

/**
 * A short connection probe, not the worker's job. It answers three things
 * and disconnects: the key works, the host answers, and which container
 * runtime is installed. Periodic health checks belong to the worker.
 */

export type SshTarget = {
  host: string;
  port: number;
  username: string;
  privateKey: string;
};

export type ProbeResult =
  | { ok: true; runtime: "podman" | "docker" | null; version: string | null }
  | { ok: false; error: string };

const RUNTIME_COMMAND =
  "command -v podman >/dev/null 2>&1 && podman --version || " +
  "(command -v docker >/dev/null 2>&1 && docker --version) || echo none";

export function parseRuntimeOutput(text: string): {
  runtime: "podman" | "docker" | null;
  version: string | null;
} {
  const match = /(podman|docker) version (\d+\.\d+\.\d+)/i.exec(text.trim());
  if (!match) return { runtime: null, version: null };
  return {
    runtime: match[1].toLowerCase() as "podman" | "docker",
    version: match[2] ?? null,
  };
}

export function probeServer(target: SshTarget, timeoutMs = 10_000): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const client = new Client();
    let settled = false;

    const finish = (result: ProbeResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      client.end();
      resolve(result);
    };

    const timer = setTimeout(
      () => finish({ ok: false, error: `timed out after ${timeoutMs}ms` }),
      timeoutMs,
    );

    client.on("error", (error) => finish({ ok: false, error: error.message }));

    client.on("ready", () => {
      client.exec(RUNTIME_COMMAND, (error, stream) => {
        if (error) return finish({ ok: false, error: error.message });
        let output = "";
        stream.on("data", (chunk: Buffer) => {
          output += chunk.toString();
        });
        stream.stderr.on("data", (chunk: Buffer) => {
          output += chunk.toString();
        });
        stream.on("close", () => {
          const { runtime, version } = parseRuntimeOutput(output);
          finish({ ok: true, runtime, version });
        });
      });
    });

    client.connect({
      host: target.host,
      port: target.port,
      username: target.username,
      privateKey: target.privateKey,
      readyTimeout: timeoutMs,
    });
  });
}
