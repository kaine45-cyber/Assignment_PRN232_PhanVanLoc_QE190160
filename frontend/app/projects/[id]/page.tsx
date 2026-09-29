"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Building2, CalendarDays, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import TaskList from "@/components/TaskList";
import { ActiveBadge, ProjectStatusBadge } from "@/components/Badges";
import { EmptyState, ErrorState, PageLoader } from "@/components/Feedback";
import { projectsApi } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useFetch(() => projectsApi.get(id), [id]);

  const progress = useMemo(() => {
    if (!data || data.tasks.length === 0) return 0;
    return Math.round((data.tasks.filter((t) => t.status === 2).length / data.tasks.length) * 100);
  }, [data]);

  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? "Project not found."} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Departments", href: "/departments" },
          { label: data.departmentName, href: `/departments/${data.departmentId}` },
          { label: data.projectName },
        ]}
        title={data.projectName}
        actions={
          <>
            <ProjectStatusBadge status={data.status} />
            <ActiveBadge active={data.isActive} />
          </>
        }
      />

      <div className="card mb-8 grid gap-6 p-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="text-sm font-medium text-slate-500">Description</h2>
          <p className="mt-1 whitespace-pre-line text-slate-800">{data.description || "No description."}</p>
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-slate-700">Progress</span>
              <span className="text-slate-500">{progress}% done</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            <dt className="text-slate-500">Department:</dt>
            <dd>
              <Link href={`/departments/${data.departmentId}`} className="font-medium text-indigo-600 hover:underline">
                {data.departmentName}
              </Link>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <dt className="text-slate-500">Timeline:</dt>
            <dd className="font-medium text-slate-800">
              {formatDate(data.startDate)} – {data.endDate ? formatDate(data.endDate) : "Ongoing"}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <dt className="text-slate-500">Created:</dt>
            <dd className="font-medium text-slate-800">{formatDateTime(data.createdDate)}</dd>
          </div>
        </dl>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        Tasks <span className="text-slate-400">({data.tasks.length})</span>
      </h2>
      {data.tasks.length > 0 ? <TaskList tasks={data.tasks} /> : <EmptyState title="No tasks in this project yet" />}
    </div>
  );
}
