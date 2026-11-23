/**
 * Removes credentials from a repository URL before it reaches a log line.
 *
 * `https://x-access-token:ghp_…@github.com/org/repo` and
 * `https://user:pass@host/path` are valid clone URLs, and a deployment log is
 * readable by every member of the organization. The scp form
 * (`git@github.com:owner/repo.git`) carries no secret and is returned as is.
 */
export function redactCredentials(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.username && !parsed.password) return url;
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    // Not a URL — the scp form has no password slot to remove.
    return url;
  }
}
