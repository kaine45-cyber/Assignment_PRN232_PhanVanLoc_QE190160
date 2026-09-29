"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TagChip } from "./Badges";

/** Multi-select dropdown for tags (checkbox list with search + removable chips). */
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

  const toggle = (tagId: number) =>
    onChange(value.includes(tagId) ? value.filter((v) => v !== tagId) : [...value, tagId]);

  const selected = tags.filter((t) => value.includes(t.tagId));
  const filtered = tags.filter((t) => t.tagName.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input flex min-h-[42px] items-center justify-between gap-2 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex flex-wrap gap-1">
          {selected.length === 0 ? (
            <span className="text-slate-400">Select tags…</span>
          ) : (
            selected.map((t) => (
              <span key={t.tagId} className="inline-flex items-center">
                <TagChip tag={t} />
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${t.tagName}`}
                  className="-ml-1 rounded p-0.5 text-slate-400 hover:text-slate-700"
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
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <input
            autoFocus
            className="input mb-2"
            placeholder="Filter tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="max-h-52 overflow-y-auto" role="listbox" aria-multiselectable>
            {filtered.length === 0 && <li className="px-2 py-1.5 text-sm text-slate-400">No tags found</li>}
            {filtered.map((t) => {
              const checked = value.includes(t.tagId);
              return (
                <li key={t.tagId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggle(t.tagId)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border",
                        checked ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300",
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <TagChip tag={t} />
                  </button>
                </li>
              );
            })}
          </ul>
          {value.length > 0 && (
            <button type="button" className="mt-2 w-full text-center text-xs text-slate-500 hover:text-slate-800" onClick={() => onChange([])}>
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
