import type { Metadata } from "next";
import { headers } from "next/headers";
import { AcceptInvitation } from "@/components/members/AcceptInvitation";
import { InvitationSignUp } from "@/components/members/InvitationSignUp";
import { PageHeader } from "@/components/shell/PageHeader";
import { getAuth } from "@/lib/auth";
import { invitationAcceptable, invitationById } from "@/lib/members";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accept invitation — Enerthya Host",
};

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invitation, session] = await Promise.all([
    invitationById(id).catch(() => null),
    getAuth().api.getSession({ headers: await headers() }),
  ]);

  if (!invitation || !invitationAcceptable(invitation)) {
    return (
      <PageHeader label="Invitation" title="Nothing to accept.">
        This invitation does not exist, was already used, or expired. Ask an admin for another.
      </PageHeader>
    );
  }

  return (
    <>
      <PageHeader label="Invitation" title="Join this organization.">
        You were invited as <strong>{invitation.role}</strong> to {invitation.organizationName}.
        {session
          ? " Accepting adds this account to it."
          : " Create the account this invitation was sent to, and it joins the organization."}
      </PageHeader>
      {session ? (
        <AcceptInvitation id={id} />
      ) : (
        <InvitationSignUp
          id={id}
          email={invitation.email}
          organizationName={invitation.organizationName}
        />
      )}
    </>
  );
}
