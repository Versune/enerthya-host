import type { Metadata } from "next";
import Link from "next/link";
import { HostStats } from "@/components/shell/HostStats";
import { PageHeader } from "@/components/shell/PageHeader";
import { StatusDot } from "@/components/shell/StatusDot";
import { getAuth } from "@/lib/auth";
import { listDeployments } from "@/lib/deployments";
import { requireSession } from "@/lib/require-session";

function timestamp(date: Date): string {
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Overview — Enerthya Host",
};

export default async function OverviewPage() {
  const { session, requestHeaders } = await requireSession();
  const organizations = await getAuth().api.listOrganizations({ headers: requestHeaders });
  const active =
    organizations.find((org) => org.id === session.session.activeOrganizationId) ??
    organizations[0];

  const deployments = active ? (await listDeployments(active.id)).slice(0, 5) : [];

  return (
    <>
      <PageHeader label="Overview" title={active?.name ?? "No organization yet."}>
        Signed in as {session.user.name} ({session.user.email}). A deploy builds, passes its health
        check and only then replaces the old container; domains, encrypted environment variables,
        logs, metrics, managed databases and verified backups are here too.
      </PageHeader>

      <section className="page__section">
        <div className="section-head">
          <h2 className="section-head__title">Start</h2>
          <span className="section-head__meta">application · project · server</span>
        </div>
        <div className="quick-actions">
          <Link className="btn" href="/applications">
            New application
          </Link>
          <Link className="btn btn--quiet" href="/projects">
            New project
          </Link>
          <Link className="btn btn--quiet" href="/servers">
            Add a server
          </Link>
        </div>
      </section>

      <section className="page__section">
        <div className="section-head">
          <h2 className="section-head__title">Recent activity</h2>
          <Link className="recent__more" href="/deployments">
            all deployments →
          </Link>
        </div>
        {deployments.length === 0 ? (
          <div className="empty">
            <strong className="label">Nothing deployed yet</strong>
            <p>
              Press Deploy on an application and its attempt appears here with the state it actually
              reported.
            </p>
            <Link className="btn" href="/applications">
              Open applications
            </Link>
          </div>
        ) : (
          <ul className="recent">
            {deployments.map((deployment) => (
              <li className="recent__row" key={deployment.id}>
                <span className="recent__main">
                  <span className="recent__name">{deployment.applicationName}</span>
                  <span className="deployment__meta">
                    {deployment.projectName} · {deployment.environmentSlug} ·{" "}
                    {timestamp(deployment.startedAt ?? deployment.createdAt)}
                  </span>
                </span>
                <StatusDot status={deployment.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="page__section">
        <div className="section-head">
          <h2 className="section-head__title">Host</h2>
          <span className="section-head__meta">refreshes every 10s</span>
        </div>
        <p className="page__lede">
          The host the worker runs on. Container numbers answer whether an application is healthy;
          these answer whether the machine is.
        </p>
        <HostStats />
      </section>

      <dl className="ledger">
        {organizations.map((org) => (
          <div className="ledger__row" key={org.id}>
            <dt>{org.name}</dt>
            <dd>{org.slug}</dd>
          </div>
        ))}
      </dl>
      <p className="ledger__foot">
        {organizations.length === 1 ? "1 team" : `${organizations.length} teams`} · roles are owner,
        admin and member
      </p>
    </>
  );
}
