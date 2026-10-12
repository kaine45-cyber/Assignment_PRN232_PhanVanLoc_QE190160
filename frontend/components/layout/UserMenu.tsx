"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, UserCog, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn, initials } from "@/lib/utils";

/** Logged-in: avatar + name + role with a dropdown (dashboard, profile, logout). Logged-out: Login / Register. */
export default function UserMenu() {
  const { user, isAdmin, ready, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!ready) return <span className="h-8 w-24 animate-pulse rounded-lg bg-subtle" aria-hidden />;

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Link href="/login" className="btn btn-ghost">
          Login
        </Link>
        <Link href="/register" className="btn btn-primary">
          Register
        </Link>
      </div>
    );
  }

  const item = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg-2 transition hover:bg-subtle hover:text-fg";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-subtle"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">{initials(user.fullName)}</span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-[160px] truncate text-sm font-medium text-fg" data-testid="nav-user-name">
            {user.fullName}
          </span>
          <span className="block text-[11px] text-muted">{user.roleName}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-muted md:block" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-border bg-surface p-1.5 shadow-xl">
          <div className="border-b border-border px-2.5 pb-2.5 pt-1.5">
            <p className="truncate text-sm font-semibold text-fg">{user.fullName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <span
              className={cn(
                "mt-1.5 inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                isAdmin ? "bg-violet-500/10 text-violet-700 ring-violet-500/25 dark:text-violet-300" : "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300",
              )}
            >
              {user.roleName}
            </span>
          </div>
          <div className="py-1">
            <Link href="/admin" role="menuitem" className={item} onClick={() => setOpen(false)}>
              <LayoutDashboard className="h-4 w-4" /> Admin dashboard
            </Link>
            {isAdmin && (
              <Link href="/admin/accounts" role="menuitem" className={item} onClick={() => setOpen(false)}>
                <UserCog className="h-4 w-4" /> Accounts
              </Link>
            )}
            <Link href="/profile" role="menuitem" className={item} onClick={() => setOpen(false)}>
              <UserRound className="h-4 w-4" /> My profile
            </Link>
          </div>
          <div className="border-t border-border pt-1">
            <button type="button" role="menuitem" className={cn(item, "text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400")} onClick={() => (setOpen(false), signOut())}>
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
