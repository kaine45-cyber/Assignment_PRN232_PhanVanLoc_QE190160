"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Plus, Search } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses the global search (unless typing in a field already)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) && !target.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/search?title=${encodeURIComponent(term)}` : "/search");
    setQ("");
    inputRef.current?.blur();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
      <button type="button" className="btn btn-ghost btn-icon lg:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={submit} className="relative w-full max-w-md" role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input bg-subtle pl-9 pr-10"
          placeholder="Search tasks…"
          aria-label="Search tasks"
        />
        <span className="kbd absolute right-2.5 top-1/2 hidden -translate-y-1/2 sm:inline-flex">/</span>
      </form>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <button type="button" className="btn btn-primary hidden sm:inline-flex" onClick={() => router.push("/tasks/manage?new=1")}>
          <Plus className="h-4 w-4" /> New task
        </button>
        <button type="button" className="btn btn-primary btn-icon sm:hidden" onClick={() => router.push("/tasks/manage?new=1")} aria-label="New task">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
