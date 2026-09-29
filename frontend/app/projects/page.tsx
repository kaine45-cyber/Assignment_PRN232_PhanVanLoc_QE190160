"use client";

import Link from "next/link";
import { useState } from "react";
import { Settings } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ProjectCard from "@/components/ProjectCard";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/Feedback";
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

  return (
    <div>
      <PageHeader
        title="Projects"
        description="All active projects across departments."
        actions={
          <Link href="/projects/manage" className="btn btn-secondary">
            <Settings className="h-4 w-4" /> Manage
          </Link>
        }
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <input className="input" placeholder="Search by name…" value={name} onChange={(e) => setName(e.target.value)} aria-label="Project name" />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {PROJECT_STATUS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} aria-label="Department">
          <option value="">All departments</option>
          {departments.data?.map((d) => (
            <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <CardGridSkeleton />
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <ProjectCard key={p.projectId} project={p} />
          ))}
        </div>
      ) : (
        <EmptyState title="No projects match your filters" />
      )}
    </div>
  );
}
