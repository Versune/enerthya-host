import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Brand } from "@/components/Brand";
import { SignOutButton } from "@/components/SignOutButton";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — Enerthya Host",
};

export default async function DashboardPage() {
  const requestHeaders = await headers();
  const auth = getAuth();

  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) redirect("/sign-in");

  const organizations = await auth.api.listOrganizations({ headers: requestHeaders });
  const active =
    organizations.find((org) => org.id === session.session.activeOrganizationId) ??
    organizations[0];

  return (
    <div className="frame">
      <header className="frame__bar">
        <Brand />
        <span className="frame__env">Self-hosted panel</span>
      </header>

      <main className="screen" id="main">
        <div className="screen__col">
          <p className="label">Dashboard</p>
          <h1 className="title">{active ? active.name : "No organization yet."}</h1>
          <p className="lede">
            Signed in as {session.user.name} ({session.user.email}). Servers, projects and
            deployments arrive in the next stage; this screen proves the session is real.
          </p>
          <div className="form__actions">
            <SignOutButton />
            <a className="link" href="/sign-up">
              Create another account
            </a>
          </div>
        </div>

        <aside className="screen__ledger" aria-labelledby="org-title">
          <span className="label" id="org-title">
            Organizations
          </span>
          <dl className="ledger">
            {organizations.map((org) => (
              <div className="ledger__row" key={org.id}>
                <dt>{org.name}</dt>
                <dd>{org.slug}</dd>
              </div>
            ))}
          </dl>
          <p className="ledger__foot">
            {organizations.length === 1 ? "1 team" : `${organizations.length} teams`} · roles are
            owner, admin and member
          </p>
        </aside>
      </main>

      <footer className="frame__foot">
        <span>Enerthya Host · Apache-2.0</span>
        <span>No telemetry</span>
        <span>No third-party requests</span>
      </footer>
    </div>
  );
}
