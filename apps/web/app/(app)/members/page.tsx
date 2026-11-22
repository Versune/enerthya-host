import { roleAtLeast } from "@enerthya/core/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MembersManager } from "@/components/members/MembersManager";
import { PageHeader } from "@/components/shell/PageHeader";
import { currentOrganization } from "@/lib/current-org";
import { organizationView } from "@/lib/members";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Members — Enerthya Host",
};

export default async function MembersPage() {
  const context = await currentOrganization();
  if (!context) redirect("/sign-in");

  const view = await organizationView(context.organization.id);
  const canWrite = roleAtLeast(context.role, "admin");

  return (
    <>
      <PageHeader label="Members" title={context.organization.name}>
        Who can see and change this organization. Owners and admins invite, change roles and remove
        members; the invitation email goes out through the install's relay.
      </PageHeader>

      <MembersManager
        members={view.members ?? []}
        invitations={(view.invitations ?? []).filter(
          (invitation) => invitation.status === "pending",
        )}
        canWrite={canWrite}
        currentUserId={context.session?.user.id ?? ""}
      />
    </>
  );
}
