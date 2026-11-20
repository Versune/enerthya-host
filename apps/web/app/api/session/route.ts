import { cookies } from "next/headers";

import { readSession, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const session = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return Response.json({ authenticated: false });
  return Response.json({
    authenticated: true,
    username: session.username,
    expiresAt: session.expiresAt,
  });
}
