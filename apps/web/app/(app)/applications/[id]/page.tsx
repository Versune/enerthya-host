import { roleAtLeast } from "@enerthya/core/roles";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EnvVarActions } from "@/components/applications/EnvVarActions";
import { EnvVarForm } from "@/components/applications/EnvVarForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { getApplication } from "@/lib/applications";
import { currentOrganization } from "@/lib/current-org";
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

  const envVars = await listEnvVars(context.organization.id, id);
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
