/**
 * A hostname Caddy will route: dot-separated labels of lowercase letters,
 * digits and hyphens. No wildcards, no placeholders, no ports — Caddy's host
 * matcher treats `*` and `{…}` as syntax, and one invalid entry makes the whole
 * `/load` fail, which would block every route, not only this one.
 */
export function isValidHostname(value: string): boolean {
  if (value.length === 0 || value.length > 253) return false;
  const labels = value.split(".");
  if (labels.length < 2) return false;
  return labels.every(
    (label) =>
      label.length > 0 && label.length <= 63 && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label),
  );
}

export function isValidPort(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 65535;
}
