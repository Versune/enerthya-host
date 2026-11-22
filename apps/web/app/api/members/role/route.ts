import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";
import { setMemberRole } from "@/lib/members";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot change roles" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { memberId?: string; role?: string };
  if (!body.memberId || (body.role !== "admin" && body.role !== "member")) {
    return Response.json({ error: "memberId and role are required" }, { status: 400 });
  }

  try {
    await setMemberRole(body.memberId, body.role);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not change the role." },
      { status: 400 },
    );
  }
}
