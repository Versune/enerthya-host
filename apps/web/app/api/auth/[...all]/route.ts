import { getAuth } from "@/lib/auth";

/**
 * The whole better-auth surface: sign-in, sign-out, sessions, 2FA, invitations
 * and organization membership. The handler is resolved per request so the
 * module can be imported during a build without a database.
 */
async function handler(request: Request): Promise<Response> {
  return getAuth().handler(request);
}

export { handler as GET, handler as POST };
