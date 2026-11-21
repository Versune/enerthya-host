import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { currentOrganization } from "@/lib/current-org";
import { listDeployments } from "@/lib/deployments";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deployments — Enerthya Host",
};

/** One deterministic format: the panel is server-rendered and must not format
 * a date differently on two machines. */
function timestamp(date: Date): string {
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export default async function DeploymentsPage() {
  const context = await currentOrganization();
  if (!context) redirect("/sign-in");

  const deployments = await listDeployments(context.organization.id);

  return (
    <>
      <PageHeader
        label="Deployments"
        title={
          deployments.length === 0
            ? "Nothing has been deployed."
            : deployments.length === 1
              ? "1 deployment."
              : `${deployments.length} deployments.`
        }
      >
        Every attempt, including the ones that fail. The worker resolves the source, then stops: it
        has no container runtime yet, so it says so instead of reporting a deployment that did not
        happen.
      </PageHeader>

      {deployments.length === 0 ? (
        <div className="empty">
          <strong className="label">What will live here</strong>
          <p>
            Press Deploy on an application and its attempt appears here with the state it actually
            reached, the commit it resolved and the reason it stopped.
          </p>
        </div>
      ) : (
        <ul className="projects">
          {deployments.map((deployment) => (
            <li className="project" key={deployment.id}>
              <div className="project__id">
                <span className="project__name">{deployment.applicationName}</span>
                <span className="project__description">
                  {deployment.projectName} · {deployment.environmentSlug}
                </span>
                <span className="deployment__meta">
                  {timestamp(deployment.startedAt ?? deployment.createdAt)}
                  {deployment.commitSha ? ` · ${deployment.commitSha.slice(0, 7)}` : ""}
                  {deployment.imageTag ? ` · ${deployment.imageTag}` : ""}
                </span>
                {deployment.error ? (
                  <span className="deployment__error">{deployment.error}</span>
                ) : null}
              </div>
              <span
                className={`env-chip${deployment.status === "failed" ? " env-chip--failed" : ""}`}
              >
                {deployment.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
