import type { Metadata } from "next";
import { HostStats } from "@/components/shell/HostStats";
import { PageHeader } from "@/components/shell/PageHeader";
import { getAuth } from "@/lib/auth";
import { requireSession } from "@/lib/require-session";

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

  return (
    <>
      <PageHeader label="Overview" title={active?.name ?? "No organization yet."}>
        Signed in as {session.user.name} ({session.user.email}). A deploy builds, passes its health
        check and only then replaces the old container; domains, encrypted environment variables,
        logs, metrics, managed databases and verified backups are here too.
      </PageHeader>

      <section className="page__section">
        <h2 className="label">This machine</h2>
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
