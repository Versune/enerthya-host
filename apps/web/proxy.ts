import { type NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Custom route handlers authenticate with the session cookie alone. SameSite=Lax
 * does not stop a same-site origin — another port on the host, a sibling
 * subdomain — from sending a credentialed request, and `request.json()` accepts
 * a text/plain body. Every state-changing API call must therefore be
 * same-origin. `/api/auth/*` is left to better-auth, whose trusted-origin list
 * is intentionally wider than same-origin.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (SAFE_METHODS.has(request.method)) return NextResponse.next();
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");

  if (origin) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: "Cross-origin request refused." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid Origin header." }, { status: 403 });
    }
    return NextResponse.next();
  }

  // No Origin (non-browser clients). Use Fetch Metadata when it is present;
  // webhook senders legitimately omit both and are authenticated by HMAC.
  if (site && site !== "same-origin" && site !== "none") {
    return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
