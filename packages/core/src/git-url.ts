/**
 * A repository URL the worker may clone. The worker runs `git clone` with the
 * URL as an argument, so the shape matters: only https, http and ssh are
 * useful here, and a credential embedded in the URL ends up in storage, in a
 * page and in a deployment log, so it is refused — the deploy key is the place
 * for a secret.
 *
 * `ssh://git@host/owner/repo` keeps its username: "git" is not a secret.
 */
export function isAcceptableRepositoryUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:" && parsed.protocol !== "ssh:") {
    return false;
  }
  if (parsed.password) return false;
  return parsed.protocol.startsWith("http") ? parsed.username === "" : true;
}
