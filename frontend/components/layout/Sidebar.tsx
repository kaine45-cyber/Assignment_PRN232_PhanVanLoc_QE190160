"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Search,
  Settings2,
  Tags,
  ListChecks,
  Layers,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ApiStatus from "./ApiStatus";

const SECTIONS = [
  {
    title: "Workspace",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/departments", label: "Departments", icon: Building2 },
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/tasks", label: "Tasks", icon: ListTodo },
      { href: "/search", label: "Search", icon: Search },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/departments/manage", label: "Departments", icon: Settings2 },
      { href: "/projects/manage", label: "Projects", icon: Layers },
      { href: "/tasks/manage", label: "Tasks", icon: ClipboardList },
      { href: "/tags/manage", label: "Tags", icon: Tags },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.endsWith("/manage")) return pathname === href;
  // "/projects" is active for "/projects/3" but not for "/projects/manage"
  return pathname === href || (pathname.startsWith(href + "/") && !pathname.endsWith("/manage"));
}

export default function Sidebar({ onNavigate, inDrawer = false }: { onNavigate?: () => void; inDrawer?: boolean }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
          <ListChecks className="h-3.5 w-3.5" />
        </span>
        <Link href="/" onClick={onNavigate} className="text-[15px] font-semibold tracking-tight text-fg">
          TaskTrack
        </Link>
        {!inDrawer && <span className="ml-auto rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">v1.0</span>}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{section.title}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition",
                        active ? "bg-primary-soft text-primary" : "text-fg-2 hover:bg-subtle hover:text-fg",
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted group-hover:text-fg")} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <ApiStatus />
      </div>
    </div>
  );
}
