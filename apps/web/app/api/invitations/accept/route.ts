import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { acceptInvitation } from "@/lib/members";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // A session, not a membership: the whole point is that this account does not
  // belong to an organization yet.
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Sign in first." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });

  try {
    await acceptInvitation(body.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not accept the invitation." },
      { status: 400 },
    );
  }
}
