"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/Brand";

export const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/servers", label: "Servers" },
  { href: "/projects", label: "Projects" },
  { href: "/applications", label: "Applications" },
  { href: "/deployments", label: "Deployments" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <Brand />
      </div>

      <nav className="sidebar__nav" aria-label="Dashboard">
        <span className="label">Workspace</span>
        <ul>
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  className="nav-item"
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="sidebar__foot">
        Servers, projects, applications and deployments. Domains, logs, databases and backups
        come next.
      </p>
    </aside>
  );
}
