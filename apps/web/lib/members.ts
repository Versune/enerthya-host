import { getDb, notifyChannel, selectInvitation } from "@enerthya/db";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export type MemberRow = {
  id: string;
  userId: string;
  role: string;
  user: { name: string; email: string };
};

export type InvitationRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date | string;
};

/** Members and pending invitations in one read, as better-auth returns them. */
export async function organizationView(organizationId: string) {
  const full = await getAuth().api.getFullOrganization({
    query: { organizationId },
    headers: await headers(),
  });
  return full as unknown as {
    name: string;
    members: MemberRow[];
    invitations: InvitationRow[];
  };
}

function invitationEmail(organization: string, link: string) {
  const text = [
    `You were invited to ${organization} on Enerthya Host.`,
    "",
    `Accept the invitation: ${link}`,
    "",
    "If you were not expecting this, ignore this message.",
  ].join("\n");

  const html = `<div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#111;max-width:36rem;padding:24px;border:1px solid #d9d9d9">
<p style="font-size:11px;letter-spacing:.12em;margin:0">INVITATION</p>
<h1 style="font-size:22px;margin:8px 0 16px;font-weight:600">${organization}</h1>
<p style="font-size:13px;line-height:1.6">You were invited to this organization on Enerthya Host.</p>
<p style="margin:20px 0"><a href="${link}" style="background:#111;color:#fff;padding:10px 16px;text-decoration:none;font-size:13px">Accept the invitation</a></p>
<p style="font-size:12px;color:#555;margin:0">${link}</p>
</div>`;

  return { text, html };
}

/**
 * Creates the invitation in better-auth and asks the worker to deliver it: the
 * panel holds no relay credentials, and an install without SMTP still records
 * the invitation (the worker logs that it skipped the send).
 */
export async function inviteMember(input: {
  organizationId: string;
  organizationName: string;
  email: string;
  role: "admin" | "member";
}): Promise<{ id: string }> {
  const invitation = (await getAuth().api.createInvitation({
    body: { email: input.email, role: input.role, organizationId: input.organizationId },
    headers: await headers(),
  })) as { id: string };

  const base = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const link = `${base}/accept-invitation/${invitation.id}`;
  const { text, html } = invitationEmail(input.organizationName, link);

  await notifyChannel(
    getDb(),
    "email_send",
    JSON.stringify({
      to: input.email,
      subject: `Invitation to ${input.organizationName} on Enerthya Host`,
      text,
      html,
    }),
  );

  return invitation;
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  await getAuth().api.cancelInvitation({
    body: { invitationId },
    headers: await headers(),
  });
}

export async function setMemberRole(memberId: string, role: "admin" | "member"): Promise<void> {
  await getAuth().api.updateMemberRole({
    body: { memberId, role },
    headers: await headers(),
  });
}

export async function removeMember(memberId: string, organizationId: string): Promise<void> {
  await getAuth().api.removeMember({
    body: { memberIdOrEmail: memberId, organizationId },
    headers: await headers(),
  });
}

export async function acceptInvitation(invitationId: string): Promise<void> {
  await getAuth().api.acceptInvitation({
    body: { invitationId },
    headers: await headers(),
  });
}

/**
 * An invitation can be accepted while it is pending and inside its window.
 * Kept pure so the rule is testable without a session or a database.
 */
export function invitationAcceptable(
  invitation: { status: string; expiresAt: Date },
  now: Date = new Date(),
): boolean {
  return invitation.status === "pending" && invitation.expiresAt.getTime() > now.getTime();
}

export async function invitationById(invitationId: string) {
  return selectInvitation(getDb(), invitationId);
}
