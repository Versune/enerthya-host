export type Role = "owner" | "admin" | "member";

const RANK: Record<Role, number> = { member: 1, admin: 2, owner: 3 };

/**
 * owner > admin > member. Writes require admin; member is read-only until
 * finer-grained permissions exist.
 */
export function roleAtLeast(role: Role, required: Role): boolean {
  return RANK[role] >= RANK[required];
}
