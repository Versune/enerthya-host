import { roleAtLeast } from "@enerthya/core/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProjectActions } from "@/components/projects/ProjectActions";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { currentOrganization } from "@/lib/current-org";
import { listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects — Enerthya Host",
};

export default async function ProjectsPage() {
  const context = await currentOrganization();
  if (!context) redirect("/sign-in");

  const projects = await listProjects(context.organization.id);
  const canWrite = roleAtLeast(context.role, "admin");

  return (
    <>
      <PageHeader
        label="Projects"
        title={projects.length === 1 ? "1 project." : `${projects.length} projects.`}
      >
        A project groups environments and the applications inside them. Every project starts with
        production and staging; an application will attach to one of them.
      </PageHeader>

      {projects.length === 0 ? (
        <div className="empty">
          <strong className="label">No projects yet</strong>
          <p>
            Create the first one with the form below. It gets a slug, a production environment and a
            staging environment in one step.
          </p>
        </div>
      ) : (
        <ul className="projects">
          {projects.map((project) => (
            <li className="project" key={project.id}>
              <div className="project__id">
                <span className="project__name">{project.name}</span>
                <span className="project__slug">{project.slug}</span>
                {project.description ? (
                  <span className="project__description">{project.description}</span>
                ) : null}
              </div>
              <ul className="env-chips" aria-label="Environments">
                {project.environments.map((environment) => (
                  <li className="env-chip" key={environment.id}>
                    {environment.slug}
                  </li>
                ))}
              </ul>
              {canWrite ? <ProjectActions id={project.id} /> : null}
            </li>
          ))}
        </ul>
      )}

      {canWrite ? (
        <details className="add-project">
          <summary className="btn btn--quiet">Create a project</summary>
          <ProjectForm />
        </details>
      ) : (
        <p className="ledger__foot">
          Your role is read-only here. An owner or admin can create projects.
        </p>
      )}
    </>
  );
}
