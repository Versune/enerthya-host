import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";

/**
 * Container runtime detection.
 *
 * The panel talks to Podman and Docker through their own binaries. This module
 * answers three questions the product must never guess: which runtimes exist,
 * whether they are usable, and what that means on this operating system.
 */

export type RuntimeEntry = {
  name: "podman" | "docker";
  path: string | null;
  available: boolean;
  version: string | null;
  minimum: string;
  rootless: boolean | null;
  usable: boolean;
  reason: string;
};

export type RuntimeReport = {
  platform: {
    system: string;
    release: string;
    machine: string;
    support: "native" | "vm" | "unsupported";
    note: string;
  };
  runtimes: RuntimeEntry[];
  recommended: "podman" | "docker" | null;
};

const MINIMUM: Record<"podman" | "docker", [number, number, number]> = {
  podman: [4, 9, 0],
  docker: [24, 0, 0],
};

function run(file: string, args: string[]): Promise<{ code: number; stdout: string }> {
  return new Promise((resolve) => {
    execFile(file, args, { timeout: 10_000, maxBuffer: 1 << 20 }, (error, stdout) => {
      resolve({ code: error ? 1 : 0, stdout: stdout?.toString() ?? "" });
    });
  });
}

function parseVersion(text: string): [number, number, number] | null {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(text || "");
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

function atLeast(found: [number, number, number], minimum: [number, number, number]) {
  for (let i = 0; i < 3; i += 1) {
    if (found[i] > minimum[i]) return true;
    if (found[i] < minimum[i]) return false;
  }
  return true;
}

function platformReport() {
  const system = os.type();
  const support = system === "Linux" ? "native" : system === "Darwin" || system === "Windows_NT" ? "vm" : "unsupported";
  const label = system === "Windows_NT" ? "Windows" : system;
  return {
    system: label,
    release: os.release(),
    machine: os.arch(),
    support: support as "native" | "vm" | "unsupported",
    note:
      support === "native"
        ? "Containers run on this kernel; rootless is available."
        : support === "vm"
          ? "Containers run inside the runtime's virtual machine; rootless here means rootless inside that VM."
          : "This operating system is not part of the tested matrix.",
  };
}

async function probePodman(binary: string, entry: RuntimeEntry) {
  const { code, stdout } = await run(binary, ["info", "--format", "json"]);
  if (code !== 0) return;
  try {
    const info = JSON.parse(stdout) as {
      version?: { Version?: string };
      host?: { serviceIsRemote?: boolean; security?: { rootless?: boolean } };
    };
    const version = parseVersion(info.version?.Version ?? "");
    if (version) entry.version = version.join(".");
    entry.rootless = info.host?.security?.rootless === true;
    if (info.host?.serviceIsRemote === true) entry.reason = "points at a remote endpoint; this panel manages the local host only";
    else if (version && atLeast(version, MINIMUM.podman)) entry.usable = true;
  } catch {
    entry.reason = "podman is installed but its info is unreadable";
  }
}

async function probeDocker(binary: string, entry: RuntimeEntry) {
  const { code, stdout } = await run(binary, ["info", "--format", "{{json .}}"]);
  if (code !== 0) return;
  try {
    const info = JSON.parse(stdout) as {
      ServerVersion?: string;
      SecurityOptions?: string[];
      OperatingSystem?: string;
    };
    const version = parseVersion(info.ServerVersion ?? "");
    if (version) entry.version = version.join(".");
    entry.rootless = (info.SecurityOptions ?? []).some((option) => option.includes("rootless"));
    if (process.env.DOCKER_HOST) {
      entry.reason = "DOCKER_HOST is set; this panel manages a local daemon only";
    } else if (version && atLeast(version, MINIMUM.docker)) {
      entry.usable = true;
    }
  } catch {
    entry.reason = "docker is installed but its info is unreadable";
  }
}

export async function detectRuntimes(): Promise<RuntimeReport> {
  const platform = platformReport();
  const runtimes: RuntimeEntry[] = [];

  for (const name of ["podman", "docker"] as const) {
    const entry: RuntimeEntry = {
      name,
      path: null,
      available: false,
      version: null,
      minimum: MINIMUM[name].join("."),
      rootless: null,
      usable: false,
      reason: `${name} is not installed or not on PATH`,
    };

    // PATH lookup without a dependency: `which` is not present everywhere, so
    // ask the runtime itself to report a version and treat ENOENT as absent.
    const probe = await run(name, ["--version"]);
    if (probe.code !== 0 && !probe.stdout) {
      runtimes.push(entry);
      continue;
    }

    entry.available = true;
    entry.path = name;
    if (name === "podman") await probePodman(name, entry);
    else await probeDocker(name, entry);

    if (!entry.usable && !entry.reason.includes("remote") && entry.version) {
      const found = parseVersion(entry.version);
      if (found && !atLeast(found, MINIMUM[name])) {
        entry.reason = `${name} ${entry.version} is older than the required ${entry.minimum}`;
      } else if (!entry.reason.startsWith(name)) {
        entry.reason = `${name} ${entry.version} is not ready`;
      }
    }
    if (entry.usable) {
      entry.reason = entry.rootless || platform.support !== "native" ? "ready" : `${name} is usable but not rootless`;
    }

    runtimes.push(entry);
  }

  const podman = runtimes.find((entry) => entry.name === "podman" && entry.usable);
  const docker = runtimes.find((entry) => entry.name === "docker" && entry.usable);

  return { platform, runtimes, recommended: podman ? "podman" : docker ? "docker" : null };
}

export function stateDir(): string {
  return path.resolve(process.env.ENERTHYA_STATE_DIR || ".enerthya-state");
}
