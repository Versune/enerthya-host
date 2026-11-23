import { countUsers, getDb, hasPendingInvitation } from "@enerthya/db";

/**
 * Who may create an account on this install.
 *
 * The first account claims the machine — there is nobody to invite anyone yet.
 * After that, registration is closed: the only door is an invitation for the
 * exact address. A public panel with an open sign-up lets any visitor create an
 * organization on someone else's hardware.
 */
export function registrationAllowed(userCount: number, invited: boolean): boolean {
  return userCount === 0 || invited;
}

export async function signUpOpenFor(email?: string): Promise<boolean> {
  const db = getDb();
  const userCount = await countUsers(db);
  const invited = userCount > 0 && email ? await hasPendingInvitation(db, email) : false;
  return registrationAllowed(userCount, invited);
}
