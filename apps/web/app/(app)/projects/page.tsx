import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects — Enerthya Host",
};

export default function ProjectsPage() {
  return (
    <>
      <PageHeader label="Projects" title="No projects yet.">
        A project groups environments (production, staging) and the applications inside them.
        Creating one ships with the applications stage; this screen will not pretend otherwise.
      </PageHeader>

      <div className="empty">
        <strong className="label">What will live here</strong>
        <p>
          One row per project: name, slug, its environments, and what is deployed in each. An empty
          project will be a normal state, not an error.
        </p>
      </div>
    </>
  );
}
