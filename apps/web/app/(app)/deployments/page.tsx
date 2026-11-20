import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deployments — Enerthya Host",
};

export default function DeploymentsPage() {
  return (
    <>
      <PageHeader label="Deployments" title="Nothing has been deployed.">
        Deployments will be the record of every build: the commit, the image, the health check and
        the moment traffic moved. None of that pipeline exists yet.
      </PageHeader>

      <div className="empty">
        <strong className="label">What will live here</strong>
        <p>
          One row per deployment with its real state, a link to its logs and the rollback that
          restored the previous container. A running deployment will be the only thing that says it
          is running.
        </p>
      </div>
    </>
  );
}
