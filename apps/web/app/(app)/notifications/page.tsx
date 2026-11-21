import { roleAtLeast } from "@enerthya/core/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChannelActions } from "@/components/notifications/ChannelActions";
import { ChannelForm } from "@/components/notifications/ChannelForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { currentOrganization } from "@/lib/current-org";
import { listChannels } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications — Enerthya Host",
};

export default async function NotificationsPage() {
  const context = await currentOrganization();
  if (!context) redirect("/sign-in");

  const channels = await listChannels(context.organization.id);
  const canWrite = roleAtLeast(context.role, "admin");

  return (
    <>
      <PageHeader
        label="Notifications"
        title={channels.length === 1 ? "1 channel." : `${channels.length} channels.`}
      >
        Where a failed deployment is reported. The URL is encrypted at rest and only the worker uses
        it.
      </PageHeader>

      {channels.length === 0 ? (
        <div className="empty">
          <strong className="label">Nothing is notified</strong>
          <p>
            {canWrite
              ? "Add a Discord webhook or an endpoint below; both receive deployment.failed."
              : "An admin can add channels here."}
          </p>
        </div>
      ) : (
        <ul className="projects">
          {channels.map((channel) => (
            <li className="project" key={channel.id}>
              <div className="project__id">
                <span className="project__name">{channel.name}</span>
                <span className="deployment__meta">
                  {channel.type} · {channel.events.join(", ")}
                  {channel.enabled ? "" : " · disabled"}
                </span>
              </div>
              {canWrite ? <ChannelActions id={channel.id} /> : null}
            </li>
          ))}
        </ul>
      )}

      {canWrite ? (
        <details className="add-project">
          <summary className="btn btn--quiet">Add a channel</summary>
          <ChannelForm />
        </details>
      ) : null}
    </>
  );
}
