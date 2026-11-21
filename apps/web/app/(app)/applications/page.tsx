import { roleAtLeast } from "@enerthya/core/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ApplicationActions } from "@/components/applications/ApplicationActions";
import { ApplicationForm } from "@/components/applications/ApplicationForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { listApplications } from "@/lib/applications";
import { currentOrganization } from "@/lib/current-org";
import { listRollbackCandidates } from "@/lib/deployments";
import { listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Applications — Enerthya Host",
};

export default async function ApplicationsPage() {
  const context = await currentOrganization();
  if (!context) redirect("/sign-in");

  const [applications, projects, rollbackCandidates] = await Promise.all([
    listApplications(context.organization.id),
    listProjects(context.organization.id),
    listRollbackCandidates(context.organization.id),
  ]);
  const rollbackable = new Set(rollbackCandidates.map((candidate) => candidate.applicationId));
  const canWrite = roleAtLeast(context.role, "admin");
  const environments = projects.flatMap((project) =>
    project.environments.map((environment) => ({
      id: environment.id,
      label: `${project.name} · ${environment.slug}`,
    })),
  );

  return (
    <>
      <PageHeader
        label="Applications"
        title={
          applications.length === 1 ? "1 application." : `${applications.length} applications.`
        }
      >
        An application is a repository or image attached to one environment. Deploying it pulls or
        builds the image, starts the container and waits for its health check before the previous
        one stops.
      </PageHeader>

      {applications.length === 0 ? (
        <div className="empty">
          <strong className="label">No applications yet</strong>
          <p>
            {environments.length === 0
              ? "Create a project first: every application belongs to an environment."
              : "Create the first one with the form below, then press Deploy to build and run it."}
          </p>
        </div>
      ) : (
        <ul className="projects">
          {applications.map((application) => (
            <li className="project" key={application.id}>
              <div className="project__id">
                <span className="project__name">{application.name}</span>
                <span className="project__slug">
                  {application.sourceType === "git"
                    ? `${application.gitUrl} · ${application.gitBranch}`
                    : application.dockerImage}
                </span>
                <span className="project__description">
                  {application.projectName} · {application.environmentSlug} ·{" "}
                  {application.buildType} · :{application.port}
                </span>
              </div>
              {canWrite ? (
                <ApplicationActions
                  id={application.id}
                  canRollback={rollbackable.has(application.id)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {canWrite && environments.length > 0 ? (
        <details className="add-project">
          <summary className="btn btn--quiet">Create an application</summary>
          <ApplicationForm environments={environments} />
        </details>
      ) : null}
      {!canWrite ? (
        <p className="ledger__foot">Your role is read-only here. An owner or admin can create.</p>
      ) : null}
    </>
  );
}
