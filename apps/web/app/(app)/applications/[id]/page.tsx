import { roleAtLeast } from "@enerthya/core/roles";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DomainActions } from "@/components/applications/DomainActions";
import { DomainForm } from "@/components/applications/DomainForm";
import { EnvVarActions } from "@/components/applications/EnvVarActions";
import { EnvVarForm } from "@/components/applications/EnvVarForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { getApplication, getDeployHook, getDeployKeyPublic } from "@/lib/applications";
import { currentOrganization } from "@/lib/current-org";
import { listDomains } from "@/lib/domains";
import { listEnvVars } from "@/lib/env-vars";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Application — Enerthya Host",
};

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await currentOrganization();
  if (!context) redirect("/sign-in");

  const { id } = await params;
  const application = await getApplication(context.organization.id, id);
  if (!application) notFound();

  const [envVars, hook, domainList, deployKey] = await Promise.all([
    listEnvVars(context.organization.id, id),
    getDeployHook(context.organization.id, id),
    listDomains(context.organization.id, id),
    getDeployKeyPublic(context.organization.id, id),
  ]);
  const canWrite = roleAtLeast(context.role, "admin");
  const source =
    application.sourceType === "git"
      ? `${application.gitUrl} · ${application.gitBranch}`
      : (application.dockerImage ?? "image");

  return (
    <>
      <PageHeader label="Application" title={`${application.name}.`}>
        {application.projectName} · {application.environmentSlug} · {source} ·{" "}
        {application.buildType} · :{application.port}
      </PageHeader>

      <p className="page__back">
        <Link href="/applications">← All applications</Link>
      </p>

      <section className="page__section">
        <h2 className="label">Domains</h2>
        <p className="page__lede">
          Point the domain's DNS at this machine, then add it here. The proxy picks it up on the
          next deployment and obtains the certificate; nothing is served until a deployment has
          reached running.
        </p>

        {domainList.length === 0 ? (
          <div className="empty">
            <strong className="label">No domains</strong>
            <p>
              {canWrite
                ? "Add one below once its DNS record points here."
                : "An admin can add domains here."}
            </p>
          </div>
        ) : (
          <ul className="projects">
            {domainList.map((domain) => (
              <li className="project" key={domain.id}>
                <div className="project__id">
                  <span className="project__name">{domain.hostname}</span>
                  <span className="deployment__meta">{domain.status}</span>
                </div>
                {canWrite ? (
                  <DomainActions applicationId={application.id} domainId={domain.id} />
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canWrite ? (
          <details className="add-project">
            <summary className="btn btn--quiet">Add a domain</summary>
            <DomainForm applicationId={application.id} />
          </details>
        ) : null}
      </section>

      <section className="page__section">
        <h2 className="label">Auto-deploy</h2>
        <p className="page__lede">
          GitHub calls this URL on every push. A push to <code>{application.gitBranch}</code> queues
          a deployment; anything else is ignored. The signature is verified with the secret below,
          so the URL alone cannot trigger anything. The deploy key is what lets a private repository
          be cloned — add it under the repository's Deploy keys, read-only.
        </p>
        {hook?.webhookSecret && application.sourceType === "git" ? (
          <dl className="hook">
            <dt className="label">Payload URL</dt>
            <dd className="hook__value">
              {`${process.env.BETTER_AUTH_URL ?? ""}/api/webhooks/github/${application.id}`}
            </dd>
            <dt className="label">Secret</dt>
            <dd className="hook__value">{hook.webhookSecret}</dd>
            <dt className="label">Content type</dt>
            <dd className="hook__value">application/json</dd>
            {deployKey ? (
              <>
                <dt className="label">Deploy key (read-only)</dt>
                <dd className="hook__value">{deployKey}</dd>
              </>
            ) : null}
          </dl>
        ) : (
          <p className="deployment__meta">
            This application deploys an image, so there is nothing to hook a push to.
          </p>
        )}
      </section>

      <section className="page__section">
        <h2 className="label">Environment variables</h2>
        <p className="page__lede">
          Stored encrypted with AES-256-GCM and only decrypted by the worker when it builds and
          starts the container. The panel shows the name and never the value.
        </p>

        {envVars.length === 0 ? (
          <div className="empty">
            <strong className="label">No variables</strong>
            <p>
              {canWrite
                ? "Add the first one below. It reaches the container on the next deployment."
                : "An admin can add variables here."}
            </p>
          </div>
        ) : (
          <ul className="projects">
            {envVars.map((envVar) => (
              <li className="project" key={envVar.id}>
                <div className="project__id">
                  <span className="project__name">{envVar.key}</span>
                  <span className="deployment__meta">
                    {"••••••••"}
                    {envVar.isBuildTime ? " · runtime and build" : " · runtime only"}
                  </span>
                </div>
                {canWrite ? (
                  <EnvVarActions applicationId={application.id} varId={envVar.id} />
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canWrite ? (
          <details className="add-project">
            <summary className="btn btn--quiet">Add a variable</summary>
            <EnvVarForm applicationId={application.id} />
          </details>
        ) : null}
      </section>
    </>
  );
}
