"use client";

import { useParams } from "next/navigation";
import { Building2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ProjectCard from "@/components/ProjectCard";
import { ActiveBadge } from "@/components/Badges";
import { EmptyState, ErrorState, PageLoader } from "@/components/Feedback";
import { departmentsApi } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useFetch(() => departmentsApi.get(id), [id]);

  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? "Department not found."} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Departments", href: "/departments" }, { label: data.departmentName }]}
        title={
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Building2 className="h-5 w-5" />
            </span>
            {data.departmentName}
          </span>
        }
        description={data.departmentDescription}
        actions={<ActiveBadge active={data.isActive} />}
      />

      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        Projects <span className="text-slate-400">({data.projects.length})</span>
      </h2>
      {data.projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.projects.map((p) => (
            <ProjectCard key={p.projectId} project={p} showDepartment={false} />
          ))}
        </div>
      ) : (
        <EmptyState title="This department has no active projects" />
      )}
    </div>
  );
}
