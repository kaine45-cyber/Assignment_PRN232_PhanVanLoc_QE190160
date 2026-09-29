"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Search, Settings2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DepartmentAvatar from "@/components/DepartmentAvatar";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/ui/Feedback";
import { departmentsApi } from "@/lib/api";
import { useDebounce, useFetch } from "@/lib/useFetch";

export default function DepartmentsPage() {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query);
  const { data, loading, error, reload } = useFetch(
    () => (debounced.trim() ? departmentsApi.search(debounced) : departmentsApi.list()),
    [debounced],
  );

  return (
    <div>
      <PageHeader
        title="Departments"
        description="All active departments. Select one to see its projects."
        actions={
          <Link href="/departments/manage" className="btn btn-secondary">
            <Settings2 className="h-4 w-4" /> Manage
          </Link>
        }
      />
      <div className="relative mb-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="input pl-9" placeholder="Search departments by name…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search departments" />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <CardGridSkeleton />
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((d) => (
            <Link
              key={d.departmentId}
              href={`/departments/${d.departmentId}`}
              className="card group flex flex-col p-5 transition hover:border-border-strong hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <DepartmentAvatar id={d.departmentId} name={d.departmentName} />
                <h3 className="flex-1 font-semibold text-fg group-hover:text-primary">{d.departmentName}</h3>
                <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <p className="mt-3 flex-1 text-sm text-muted">{d.departmentDescription}</p>
              <p className="mt-5 border-t border-border pt-4 text-xs text-muted">
                <span className="font-semibold text-fg tabular-nums">{d.projectCount}</span> active project{d.projectCount === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState title="No departments found" description={query ? "Try a different search term." : undefined} />
        </div>
      )}
    </div>
  );
}
