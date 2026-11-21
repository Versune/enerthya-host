import { roleAtLeast } from "@enerthya/core/roles";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackupActions } from "@/components/databases/BackupActions";
import { DatabaseActions } from "@/components/databases/DatabaseActions";
import { DatabaseForm } from "@/components/databases/DatabaseForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { currentOrganization } from "@/lib/current-org";
import { connectionString, listBackups, listManagedDatabases } from "@/lib/databases";
import { listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Databases — Enerthya Host",
};

export default async function DatabasesPage() {
  const context = await currentOrganization();
  if (!context) redirect("/sign-in");

  const canWrite = roleAtLeast(context.role, "admin");
  const [databases, projects, backups] = await Promise.all([
    listManagedDatabases(context.organization.id),
    listProjects(context.organization.id),
    listBackups(context.organization.id),
  ]);

  const latestBackup = new Map<string, (typeof backups)[number]>();
  for (const backup of backups) {
    if (!latestBackup.has(backup.databaseId)) latestBackup.set(backup.databaseId, backup);
  }

  const environments = projects.flatMap((project) =>
    project.environments.map((environment) => ({
      id: environment.id,
      label: `${project.name} · ${environment.slug}`,
    })),
  );

  const connections = new Map<string, string>();
  if (canWrite) {
    for (const database of databases) {
      const url = await connectionString(context.organization.id, database);
      if (url) connections.set(database.id, url);
    }
  }

  return (
    <>
      <PageHeader
        label="Databases"
        title={databases.length === 1 ? "1 database." : `${databases.length} databases.`}
      >
        A Postgres server created on this host, with its own volume and a generated password. The
        connection string is shown to admins once the container reports ready.
      </PageHeader>

      {databases.length === 0 ? (
        <div className="empty">
          <strong className="label">No databases yet</strong>
          <p>
            {canWrite
              ? "Create one below. Provisioning takes a few seconds and runs in the worker."
              : "An admin can create databases here."}
          </p>
        </div>
      ) : (
        <ul className="projects">
          {databases.map((database) => {
            const url = connections.get(database.id);
            return (
              <li className="project" key={database.id}>
                <div className="project__id">
                  <span className="project__name">{database.name}</span>
                  <span className="project__description">
                    {database.engine} {database.version} · {database.projectName} ·{" "}
                    {database.environmentSlug}
                  </span>
                  {url ? <code className="deployment__meta">{url}</code> : null}
                  {latestBackup.get(database.id) ? (
                    <span className="deployment__meta">
                      last backup: {latestBackup.get(database.id)?.status}
                      {latestBackup.get(database.id)?.verifiedAt ? " · verified" : ""}
                      {latestBackup.get(database.id)?.error
                        ? ` · ${latestBackup.get(database.id)?.error}`
                        : ""}
                    </span>
                  ) : null}
                </div>
                <span
                  className={`env-chip${database.status === "failed" ? " env-chip--failed" : ""}`}
                >
                  {database.status}
                </span>
                {canWrite ? (
                  <span className="server__actions">
                    <BackupActions databaseId={database.id} />
                    <DatabaseActions id={database.id} />
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {canWrite && environments.length > 0 ? (
        <details className="add-project">
          <summary className="btn btn--quiet">Create a database</summary>
          <DatabaseForm environments={environments} />
        </details>
      ) : null}
    </>
  );
}
