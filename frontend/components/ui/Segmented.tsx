"use client";

import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string | number | null> {
  value: T;
  label: React.ReactNode;
  count?: number;
}

/** Pill-style segmented control / tab list. */
export default function Segmented<T extends string | number | null>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-subtle p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
              active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn("rounded px-1.5 text-xs tabular-nums", active ? "bg-primary-soft text-primary" : "bg-border/60 text-muted")}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
