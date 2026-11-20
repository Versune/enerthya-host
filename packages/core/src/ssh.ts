import { createHash } from "node:crypto";
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
  /** Pinned on first connect; a different key is refused, not trusted. */
  expectedHostKey?: string | null;
};

export type ProbeResult =
  | {
      ok: true;
      runtime: "podman" | "docker" | null;
      version: string | null;
      fingerprint: string;
    }
  | { ok: false; error: string };

/** OpenSSH-style fingerprint: SHA256:<base64 without padding>. */
export function hostKeyFingerprint(key: Buffer): string {
  return `SHA256:${createHash("sha256").update(key).digest("base64").replace(/=+$/, "")}`;
}

export function checkHostKey(
  key: Buffer,
  expected?: string | null,
): { ok: boolean; fingerprint: string } {
  const fingerprint = hostKeyFingerprint(key);
  return { ok: !expected || expected === fingerprint, fingerprint };
}

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
    let fingerprint = "";
    let refusedHostKey = false;

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

    client.on("error", (error) =>
      finish({
        ok: false,
        error: refusedHostKey
          ? `Host key changed. Expected ${target.expectedHostKey}, got ${fingerprint}.`
          : error.message,
      }),
    );

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
          finish({ ok: true, runtime, version, fingerprint });
        });
      });
    });

    client.connect({
      host: target.host,
      port: target.port,
      username: target.username,
      privateKey: target.privateKey,
      readyTimeout: timeoutMs,
      hostVerifier: (key: Buffer) => {
        const check = checkHostKey(key, target.expectedHostKey);
        fingerprint = check.fingerprint;
        refusedHostKey = !check.ok;
        return check.ok;
      },
    });
  });
}
