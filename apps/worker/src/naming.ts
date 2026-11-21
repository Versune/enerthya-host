/**
 * The tag a repository build is stored under. It carries the deployment id, so
 * two deploys of the same commit never overwrite each other's image and a
 * rollback can name the exact image that ran.
 */
export function imageTagFor(slug: string, deploymentId: string): string {
  const safe = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `enerthya/${safe || "app"}:${deploymentId.slice(0, 12)}`;
}
