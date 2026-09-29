"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./Feedback";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Provide to make the column sortable. */
  sortValue?: (row: T) => string | number | null | undefined;
  className?: string;
  align?: "left" | "right";
}

type SortState = { key: string; dir: "asc" | "desc" } | null;

/**
 * Generic client-side table: sortable headers, pagination, sticky header, empty state.
 * Horizontally scrollable on small screens.
 */
export default function DataTable<T>({
  rows,
  columns,
  rowKey,
  pageSize = 10,
  initialSort = null,
  empty,
  minWidth = 720,
  dimmed = false,
  mobileCard,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  pageSize?: number;
  initialSort?: SortState;
  empty?: React.ReactNode;
  minWidth?: number;
  dimmed?: boolean;
  /** Optional compact card rendering used below the `md` breakpoint instead of the wide table. */
  mobileCard?: (row: T) => React.ReactNode;
}) {
  const [sort, setSort] = useState<SortState>(initialSort);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1; // nulls last
      if (vb == null) return -1;
      const r = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, columns, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const visible = sorted.slice((page - 1) * pageSize, page * pageSize);
  const from = sorted.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, sorted.length);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));

  if (rows.length === 0) {
    return <div className="card">{empty ?? <EmptyState title="Nothing here yet" />}</div>;
  }

  return (
    <div className={cn("card overflow-hidden transition-opacity", dimmed && "opacity-60")}>
      {mobileCard && (
        <ul className="divide-y divide-border md:hidden">
          {visible.map((row) => (
            <li key={rowKey(row)} className="p-4">
              {mobileCard(row)}
            </li>
          ))}
        </ul>
      )}
      <div className={cn("overflow-x-auto", mobileCard && "hidden md:block")}>
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead className="border-b border-border bg-subtle/60">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={cn("whitespace-nowrap px-4 py-2.5 text-xs font-medium text-muted", c.align === "right" && "text-right", c.className)}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cn("inline-flex items-center gap-1 rounded transition hover:text-fg", active && "text-fg")}
                      >
                        {c.header}
                        {active ? (
                          sort!.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((row) => (
              <tr key={rowKey(row)} className="transition-colors hover:bg-subtle/60">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 align-middle", c.align === "right" && "text-right", c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted sm:flex-row">
        <span>
          Showing <span className="font-medium text-fg tabular-nums">{from}</span>–<span className="font-medium text-fg tabular-nums">{to}</span> of{" "}
          <span className="font-medium text-fg tabular-nums">{sorted.length}</span>
        </span>
        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setPage((p) => p - 1)} disabled={page === 1} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                aria-current={page === i + 1 ? "page" : undefined}
                className={cn("btn btn-sm btn-icon tabular-nums", page === i + 1 ? "btn-primary" : "btn-ghost")}
              >
                {i + 1}
              </button>
            ))}
            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setPage((p) => p + 1)} disabled={page === pageCount} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Standard row-action icon button. */
export function RowAction({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("btn btn-ghost btn-sm btn-icon", danger && "hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400")}
    >
      {children}
    </button>
  );
}
