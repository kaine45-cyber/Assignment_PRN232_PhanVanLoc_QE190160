"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, ChevronRight, FolderKanban, Settings } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/Feedback";
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
            <Settings className="h-4 w-4" /> Manage
          </Link>
        }
      />
      <input
        className="input mb-6 max-w-sm"
        placeholder="Search departments by name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search departments"
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <CardGridSkeleton />
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((d) => (
            <Link
              key={d.departmentId}
              href={`/departments/${d.departmentId}`}
              className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <Building2 className="h-5 w-5" />
                </span>
                <h3 className="flex-1 font-semibold text-slate-900 group-hover:text-indigo-700">{d.departmentName}</h3>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <p className="mt-3 flex-1 text-sm text-slate-500">{d.departmentDescription}</p>
              <p className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-600">
                <FolderKanban className="h-3.5 w-3.5" /> {d.projectCount} active project{d.projectCount === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No departments found" description={query ? "Try a different search term." : undefined} />
      )}
    </div>
  );
}
