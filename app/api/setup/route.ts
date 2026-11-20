import { cookies } from "next/headers";

import { createAccount, PanelError } from "@/lib/accounts";
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

  try {
    const account = await createAccount(body.username, body.password);
    const jar = await cookies();
    jar.set(SESSION_COOKIE, await issueSession(account.username), sessionCookieOptions());
    return Response.json({ status: "created", username: account.username });
  } catch (error) {
    if (error instanceof PanelError) {
      const status = /already exists/i.test(error.message) ? 409 : 400;
      return Response.json({ error: error.message }, { status });
    }
    return Response.json({ error: "The account could not be written" }, { status: 500 });
  }
}
