import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AcceptInvitation } from "@/components/members/AcceptInvitation";
import { PageHeader } from "@/components/shell/PageHeader";
import { currentOrganization } from "@/lib/current-org";
import { invitationById } from "@/lib/members";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accept invitation — Enerthya Host",
};

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await currentOrganization();
  if (!context) redirect("/sign-in");

  const { id } = await params;
  const invitation = await invitationById(id).catch(() => null);

  if (!invitation || invitation.status !== "pending") {
    return (
      <PageHeader label="Invitation" title="Nothing to accept.">
        This invitation does not exist, was already used, or expired. Ask an admin for another.
      </PageHeader>
    );
  }

  return (
    <>
      <PageHeader label="Invitation" title="Join this organization.">
        You were invited as <strong>{invitation.role}</strong> to{" "}
        {invitation.organizationName ?? "this organization"}. Accepting adds this account to it.
      </PageHeader>
      <AcceptInvitation id={id} />
    </>
  );
}
