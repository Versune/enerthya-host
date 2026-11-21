import { execa } from "execa";

/**
 * `git ls-remote <url> <branch>` prints `"<sha>\trefs/heads/<branch>"`.
 * Anything else (an empty output, an annotated tag, an error page) is not a
 * commit and must not be recorded as one.
 */
export function parseLsRemote(output: string): string | null {
  for (const line of output.split("\n")) {
    const [sha] = line.trim().split(/\s+/);
    if (sha && /^[0-9a-f]{40}$/.test(sha)) return sha;
  }
  return null;
}

/**
 * Resolves the commit a branch points at without cloning anything. The command
 * runs with an argument array — the URL and branch are never part of a shell
 * string — and never prompts: a private repository fails instead of hanging
 * while a worker waits for a password that will not come.
 */
export async function resolveGitHead(url: string, branch: string): Promise<string | null> {
  const result = await execa("git", ["ls-remote", url, branch], {
    timeout: 20_000,
    reject: false,
    env: {
      GIT_TERMINAL_PROMPT: "0",
      GIT_SSH_COMMAND: "ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new",
    },
  });

  if (result.exitCode !== 0) {
    const detail = result.stderr.trim() || `git exited with ${result.exitCode}`;
    throw new Error(`Could not read ${url}: ${detail}`);
  }
  return parseLsRemote(result.stdout);
}
