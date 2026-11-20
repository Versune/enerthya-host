const MAX_LENGTH = 48;

/**
 * Turns a project or application name into the stable identifier used in
 * container names, proxy routes and backup paths.
 *
 * The result is lowercase ASCII, hyphen-separated, and safe to interpolate
 * into a resource name. It is never used as a shell argument: commands take
 * argument arrays.
 */
export function toSlug(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_LENGTH)
    .replace(/^-+|-+$/g, "");
}
