"use client";

import { Bell, Boxes, Database, FolderKanban, LayoutDashboard, Rocket, Server } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/Brand";

export const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/servers", label: "Servers", icon: Server },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/applications", label: "Applications", icon: Boxes },
  { href: "/deployments", label: "Deployments", icon: Rocket },
  { href: "/databases", label: "Databases", icon: Database },
  { href: "/notifications", label: "Notifications", icon: Bell },
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
                  <item.icon className="nav-item__icon" size={16} strokeWidth={1.6} aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="sidebar__foot">
        Servers, projects, applications and deployments, with domains, logs, metrics, databases and
        verified backups.
      </p>
    </aside>
  );
}
