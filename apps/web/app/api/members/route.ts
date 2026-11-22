import { roleAtLeast } from "@enerthya/core/roles";
import { currentOrganization } from "@/lib/current-org";
import { inviteMember, removeMember } from "@/lib/members";

export const dynamic = "force-dynamic";

/** Invites an address into the caller's organization. Admins only. */
export async function POST(request: Request) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot invite members" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string; role?: string };
  const email = body.email?.trim().toLowerCase();
  const role = body.role === "admin" ? "admin" : "member";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: "Enter a valid address." }, { status: 400 });
  }

  try {
    const invitation = await inviteMember({
      organizationId: context.organization.id,
      organizationName: context.organization.name,
      email,
      role,
    });
    return Response.json({ id: invitation.id }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The invitation failed." },
      { status: 400 },
    );
  }
}

/** Removes a member. Admins only; the owner cannot be removed. */
export async function DELETE(request: Request) {
  const context = await currentOrganization();
  if (!context) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!roleAtLeast(context.role, "admin")) {
    return Response.json({ error: "Your role cannot remove members" }, { status: 403 });
  }

  const memberId = new URL(request.url).searchParams.get("member");
  if (!memberId) return Response.json({ error: "member is required" }, { status: 400 });

  try {
    await removeMember(memberId, context.organization.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not remove the member." },
      { status: 400 },
    );
  }
}
