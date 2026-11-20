import { cookies } from "next/headers";

import { SESSION_COOKIE, sameOrigin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Cross-origin request refused" }, { status: 403 });
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return Response.json({ status: "signed-out" });
}
