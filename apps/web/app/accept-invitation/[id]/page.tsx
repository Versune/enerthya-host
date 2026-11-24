import type { Metadata } from "next";
import { headers } from "next/headers";
import { AuthScreen } from "@/components/AuthScreen";
import { AcceptInvitation } from "@/components/members/AcceptInvitation";
import { InvitationSignUp } from "@/components/members/InvitationSignUp";
import { getAuth } from "@/lib/auth";
import { invitationAcceptable, invitationById } from "@/lib/members";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accept invitation — Enerthya Host",
};

/**
 * Deliberately outside the (app) route group: that layout requires a session,
 * and the person this page exists for is someone who does not have one yet.
 */
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
      <AuthScreen
        title="Nothing to accept."
        lede="This invitation does not exist, was already used, or expired. Ask an admin of the organization for another one."
        ledgerTitle="Invitations"
        ledgerFoot="One address, one organization"
        facts={[
          {
            term: "Expired",
            detail: "An invitation can only be accepted before the date it carries.",
          },
          {
            term: "Already used",
            detail: "Accepting an invitation joins the account to the organization once.",
          },
        ]}
      >
        <p className="status">
          <strong>Have an account already?</strong> <a href="/sign-in">Sign in</a>.
        </p>
      </AuthScreen>
    );
  }

  const expires = invitation.expiresAt.toISOString().slice(0, 10);
  return (
    <AuthScreen
      title={`Join ${invitation.organizationName}.`}
      lede={
        session
          ? `This account was invited as ${invitation.role}. Accepting adds it to the organization.`
          : `Create the account this invitation was sent to, and it joins ${invitation.organizationName} as ${invitation.role}.`
      }
      ledgerTitle="The invitation"
      ledgerFoot={`Valid until ${expires}`}
      facts={[
        { term: "Address", detail: invitation.email },
        { term: "Role", detail: invitation.role },
        {
          term: "Who can send one",
          detail: "An owner or admin of the organization, from the Members screen.",
        },
      ]}
    >
      {session ? (
        <AcceptInvitation id={id} />
      ) : (
        <InvitationSignUp
          id={id}
          email={invitation.email}
          organizationName={invitation.organizationName}
        />
      )}
    </AuthScreen>
  );
}
