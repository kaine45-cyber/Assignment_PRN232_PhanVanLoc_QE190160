"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Settings2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ProjectCard from "@/components/ProjectCard";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/ui/Feedback";
import { departmentsApi, projectsApi } from "@/lib/api";
import { PROJECT_STATUS } from "@/lib/constants";
import { useDebounce, useFetch } from "@/lib/useFetch";

export default function ProjectsPage() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const debouncedName = useDebounce(name);

  const departments = useFetch(() => departmentsApi.list(), []);
  const { data, loading, error, reload } = useFetch(
    () => projectsApi.search({ name: debouncedName, status, departmentId }),
    [debouncedName, status, departmentId],
  );
  const filtered = !!(name || status || departmentId);

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Active projects across all departments."
        actions={
          <Link href="/projects/manage" className="btn btn-secondary">
            <Settings2 className="h-4 w-4" /> Manage
          </Link>
        }
      />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search by name…" value={name} onChange={(e) => setName(e.target.value)} aria-label="Project name" />
        </div>
        <select className="input sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {PROJECT_STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select className="input sm:w-52" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} aria-label="Department">
          <option value="">All departments</option>
          {departments.data?.map((d) => (
            <option key={d.departmentId} value={d.departmentId}>
              {d.departmentName}
            </option>
          ))}
        </select>
        {filtered && (
          <button className="btn btn-ghost" onClick={() => (setName(""), setStatus(""), setDepartmentId(""))}>
            Reset
          </button>
        )}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <CardGridSkeleton />
      ) : data && data.length > 0 ? (
        <>
          <p className="mb-3 text-sm text-muted">
            {data.length} project{data.length === 1 ? "" : "s"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((p) => (
              <ProjectCard key={p.projectId} project={p} />
            ))}
          </div>
        </>
      ) : (
        <div className="card">
          <EmptyState title="No projects match your filters" description="Try removing a filter." />
        </div>
      )}
    </div>
  );
}
