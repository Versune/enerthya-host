import { cookies } from "next/headers";

import { normaliseUsername, verifyPassword } from "@/lib/accounts";
import { issueSession, sameOrigin, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Cross-origin request refused" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    username?: unknown;
    password?: unknown;
  };
  if (typeof body.username !== "string" || typeof body.password !== "string") {
    return Response.json({ error: "Username and password are required" }, { status: 400 });
  }

  const valid = await verifyPassword(body.username, body.password);
  if (!valid) {
    return Response.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const username = normaliseUsername(body.username);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await issueSession(username), sessionCookieOptions());
  return Response.json({ status: "signed-in", username });
}
