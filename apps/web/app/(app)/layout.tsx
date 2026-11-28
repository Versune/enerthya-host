import type { ReactNode } from "react";
import "../shell.css";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { getAuth } from "@/lib/auth";
import { requireSession } from "@/lib/require-session";
import { Providers } from "../providers";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { session, requestHeaders } = await requireSession();
  const organizations = await getAuth().api.listOrganizations({ headers: requestHeaders });
  const active =
    organizations.find((org) => org.id === session.session.activeOrganizationId) ??
    organizations[0];

  return (
    <Providers>
      <div className="shell">
        <Sidebar />
        <div className="shell__main">
          <Topbar
            organization={active?.name ?? "No organization"}
            user={{ name: session.user.name ?? session.user.email, email: session.user.email }}
          />
          <main className="page" id="main">
            {children}
          </main>
        </div>
        <CommandPalette />
      </div>
    </Providers>
  );
}
