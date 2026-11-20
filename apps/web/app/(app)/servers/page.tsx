import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Servers — Enerthya Host",
};

export default function ServersPage() {
  return (
    <>
      <PageHeader label="Servers" title="No servers yet.">
        A server is a machine this install can reach over SSH. Connecting one — the key, the Docker
        check and the first health read — ships in the next stage.
      </PageHeader>

      <div className="empty">
        <strong className="label">What will live here</strong>
        <p>
          One row per machine: name, host, runtime, last seen, and the projects it hosts. The local
          host will be the first row, because it needs no key.
        </p>
      </div>
    </>
  );
}
