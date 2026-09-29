"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutList, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/departments", label: "Departments" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "Tasks" },
  { href: "/search", label: "Search" },
];

const manageLinks = [
  { href: "/departments/manage", label: "Departments" },
  { href: "/projects/manage", label: "Projects" },
  { href: "/tasks/manage", label: "Tasks" },
  { href: "/tags/manage", label: "Tags" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setManageOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setManageOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || (pathname.startsWith(href + "/") && !pathname.endsWith("/manage"));
  const inManage = pathname.endsWith("/manage");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <LayoutList className="h-4 w-4" />
          </span>
          TaskTrack
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {publicLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive(l.href) ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {l.label}
            </Link>
          ))}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setManageOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition",
                inManage ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
              aria-expanded={manageOpen}
            >
              Manage <ChevronDown className="h-4 w-4" />
            </button>
            {manageOpen && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {manageLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "block px-4 py-2 text-sm",
                      pathname === l.href ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {publicLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  isActive(l.href) ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100",
                )}
              >
                {l.label}
              </Link>
            ))}
            <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Manage</p>
            {manageLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  pathname === l.href ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
