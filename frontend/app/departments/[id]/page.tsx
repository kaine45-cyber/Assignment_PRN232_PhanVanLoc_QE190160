"use client";

import { useParams } from "next/navigation";
import { FolderKanban, ListTodo } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ProjectCard from "@/components/ProjectCard";
import DepartmentAvatar from "@/components/DepartmentAvatar";
import { ActiveBadge } from "@/components/Badges";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/Feedback";
import StatCard from "@/components/ui/StatCard";
import { departmentsApi } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useFetch(() => departmentsApi.get(id), [id]);

  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? "Department not found."} onRetry={reload} />;

  const taskCount = data.projects.reduce((s, p) => s + p.taskCount, 0);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Departments", href: "/departments" }, { label: data.departmentName }]}
        title={
          <span className="flex items-center gap-3">
            <DepartmentAvatar id={data.departmentId} name={data.departmentName} size="lg" />
            {data.departmentName}
          </span>
        }
        description={<span className="mt-2 block max-w-2xl">{data.departmentDescription}</span>}
        actions={<ActiveBadge active={data.isActive} />}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
        <StatCard label="Active projects" value={data.projects.length} icon={FolderKanban} />
        <StatCard label="Active tasks" value={taskCount} icon={ListTodo} />
      </div>

      <h2 className="mb-4 text-base font-semibold text-fg">Projects</h2>
      {data.projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.projects.map((p) => (
            <ProjectCard key={p.projectId} project={p} showDepartment={false} />
          ))}
        </div>
      ) : (
        <div className="card">
          <EmptyState title="No active projects" description="This department has no active projects yet." />
        </div>
      )}
    </div>
  );
}
