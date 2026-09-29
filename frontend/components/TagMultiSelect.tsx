"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TagChip } from "./Badges";

/** Multi-select for tags: searchable checkbox list + removable chips. */
export default function TagMultiSelect({
  tags,
  value,
  onChange,
  id,
}: {
  tags: Tag[];
  value: number[];
  onChange: (ids: number[]) => void;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = (tagId: number) => onChange(value.includes(tagId) ? value.filter((v) => v !== tagId) : [...value, tagId]);
  const selected = tags.filter((t) => value.includes(t.tagId));
  const filtered = tags.filter((t) => t.tagName.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} onKeyDown={(e) => e.key === "Escape" && open && (e.stopPropagation(), setOpen(false))}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input flex h-auto min-h-9 items-center justify-between gap-2 py-1.5 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex flex-wrap gap-1">
          {selected.length === 0 ? (
            <span className="text-muted">Select tags…</span>
          ) : (
            selected.map((t) => (
              <span key={t.tagId} className="inline-flex items-center gap-0.5">
                <TagChip tag={t} />
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${t.tagName}`}
                  className="rounded p-0.5 text-muted hover:bg-subtle hover:text-fg"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(t.tagId);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(t.tagId);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open && (
        <div className="mt-1.5 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
          <input autoFocus className="input mb-1.5" placeholder="Filter tags…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <ul className="max-h-52 overflow-y-auto" role="listbox" aria-multiselectable>
            {filtered.length === 0 && <li className="px-2 py-2 text-sm text-muted">No tags found</li>}
            {filtered.map((t) => {
              const checked = value.includes(t.tagId);
              return (
                <li key={t.tagId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggle(t.tagId)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-subtle"
                  >
                    <span className={cn("flex h-4 w-4 items-center justify-center rounded border", checked ? "border-primary bg-primary text-white" : "border-border-strong")}>
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color ?? "#71717A" }} aria-hidden />
                    <span className="text-fg-2">{t.tagName}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-1 flex items-center justify-between border-t border-border px-2 pt-1.5 text-xs text-muted">
            <span>{value.length} selected</span>
            {value.length > 0 && (
              <button type="button" className="hover:text-fg" onClick={() => onChange([])}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
