"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface BarItem {
  key: string | number;
  label: string;
  value: number;
  href?: string;
  /** Small identity marker shown beside the label (not the bar colour). */
  marker?: React.ReactNode;
}

/**
 * Horizontal bar list for magnitude-by-category (single series → one hue, no legend).
 * Labels and values use text tokens; the hovered row shows its share of the total.
 */
export default function BarList({ items, total, unit = "tasks" }: { items: BarItem[]; total?: number; unit?: string }) {
  const [hover, setHover] = useState<string | number | null>(null);
  const max = Math.max(1, ...items.map((i) => i.value));
  const sum = total ?? items.reduce((s, i) => s + i.value, 0);

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const share = sum === 0 ? 0 : Math.round((item.value / sum) * 100);
        const row = (
          <div
            className="group rounded-md py-0.5"
            onMouseEnter={() => setHover(item.key)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(item.key)}
            onBlur={() => setHover(null)}
          >
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-fg-2">
                {item.marker}
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 tabular-nums text-fg">
                {hover === item.key ? (
                  <span className="text-muted">
                    {share}% · <span className="text-fg">{item.value}</span> {unit}
                  </span>
                ) : (
                  item.value
                )}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-series-1-track">
              <div
                className={cn("h-full rounded-full bg-series-1 transition-all duration-500", hover !== null && hover !== item.key && "opacity-50")}
                style={{ width: `${item.value === 0 ? 0 : Math.max(2, (item.value / max) * 100)}%` }}
              />
            </div>
          </div>
        );
        return (
          <li key={item.key} title={`${item.label}: ${item.value} ${unit} (${share}%)`}>
            {item.href ? (
              <Link href={item.href} className="block outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded-md">
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}
