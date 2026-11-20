import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ServerActions } from "@/components/servers/ServerActions";
import { ServerForm } from "@/components/servers/ServerForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { currentOrganization } from "@/lib/current-org";
import { ensureLocalServer, listServers } from "@/lib/servers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Servers — Enerthya Host",
};

const STATUS_LABEL = {
  ready: "ready",
  pending: "not tested",
  unreachable: "unreachable",
} as const;

export default async function ServersPage() {
  const context = await currentOrganization();
  if (!context) redirect("/sign-in");

  await ensureLocalServer(context.organization.id);
  const servers = await listServers(context.organization.id);

  return (
    <>
      <PageHeader
        label="Servers"
        title={servers.length === 1 ? "1 server." : `${servers.length} servers.`}
      >
        A server is a machine this install can reach over SSH. The local host is always first; add
        remote machines with a key, then test the connection before anything is deployed there.
      </PageHeader>

      <ul className="servers">
        {servers.map((server) => (
          <li className="server" key={server.id}>
            <div className="server__id">
              <span className="server__name">{server.name}</span>
              <span className="server__addr">
                {server.username}@{server.host}:{server.port}
              </span>
            </div>
            <div className="server__meta">
              <span className={`status-dot status-dot--${server.status}`} aria-hidden="true" />
              <span className="server__state">{STATUS_LABEL[server.status]}</span>
              <span className="server__runtime">{server.dockerVersion ?? "no runtime"}</span>
            </div>
            <ServerActions id={server.id} isLocal={server.isLocal} />
          </li>
        ))}
      </ul>

      <details className="add-server">
        <summary className="btn btn--quiet">Add a server</summary>
        <ServerForm />
      </details>
    </>
  );
}
