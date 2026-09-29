"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Columns3, List, ListTodo, Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import TaskBoard from "@/components/TaskBoard";
import { TaskMobileCard, taskColumns } from "@/components/TaskColumns";
import DepartmentAvatar from "@/components/DepartmentAvatar";
import { ActiveBadge, ProjectStatusBadge } from "@/components/Badges";
import { Card, CardHeader } from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/Feedback";
import Meter from "@/components/ui/Meter";
import Segmented from "@/components/ui/Segmented";
import StatCard from "@/components/ui/StatCard";
import { projectsApi } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { formatDate, formatDateTime, isOverdue, pct } from "@/lib/utils";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useFetch(() => projectsApi.get(id), [id]);
  const [view, setView] = useState<"list" | "board">("list");
  const columns = useMemo(() => taskColumns(), []);

  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? "Project not found."} onRetry={reload} />;

  const done = data.tasks.filter((t) => t.status === 2).length;
  const overdue = data.tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const progress = pct(done, data.tasks.length);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: data.departmentName, href: `/departments/${data.departmentId}` },
          { label: data.projectName },
        ]}
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusBadge status={data.status} />
            <ActiveBadge active={data.isActive} />
          </div>
        }
        title={data.projectName}
        actions={
          <Link href={`/tasks/manage?new=1&projectId=${data.projectId}`} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Add task
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tasks" value={data.tasks.length} icon={ListTodo} />
        <StatCard label="Completed" value={done} icon={CheckCircle2} hint={`${progress}% of tasks`} />
        <StatCard label="Overdue" value={overdue} icon={AlertTriangle} tone={overdue ? "critical" : "default"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="About this project" />
          <div className="p-5">
            <p className="whitespace-pre-line text-sm leading-relaxed text-fg-2">{data.description || "No description provided."}</p>
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-fg">Progress</span>
                <span className="tabular-nums text-muted">
                  {done}/{data.tasks.length} done · <span className="text-fg">{progress}%</span>
                </span>
              </div>
              <Meter value={progress} label="Project progress" />
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Details" />
          <dl className="divide-y divide-border text-sm">
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <dt className="text-muted">Department</dt>
              <dd>
                <Link href={`/departments/${data.departmentId}`} className="flex items-center gap-2 font-medium text-fg hover:text-primary">
                  <DepartmentAvatar id={data.departmentId} name={data.departmentName} size="sm" />
                  {data.departmentName}
                </Link>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <dt className="flex items-center gap-1.5 text-muted">
                <CalendarDays className="h-3.5 w-3.5" /> Start
              </dt>
              <dd className="font-medium text-fg">{formatDate(data.startDate)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <dt className="flex items-center gap-1.5 text-muted">
                <CalendarDays className="h-3.5 w-3.5" /> End
              </dt>
              <dd className="font-medium text-fg">{data.endDate ? formatDate(data.endDate) : "Ongoing"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <dt className="flex items-center gap-1.5 text-muted">
                <Clock className="h-3.5 w-3.5" /> Created
              </dt>
              <dd className="font-medium text-fg">{formatDateTime(data.createdDate)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-fg">
            Tasks <span className="font-normal text-muted">({data.tasks.length})</span>
          </h2>
          <Segmented
            ariaLabel="Task view"
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: <><List className="h-4 w-4" /> List</> },
              { value: "board", label: <><Columns3 className="h-4 w-4" /> Board</> },
            ]}
          />
        </div>
        {data.tasks.length === 0 ? (
          <div className="card">
            <EmptyState title="No tasks yet" description="Add the first task to this project." />
          </div>
        ) : view === "list" ? (
          <DataTable rows={data.tasks} columns={columns} rowKey={(t) => t.taskId}
          mobileCard={(t) => <TaskMobileCard task={t} />} minWidth={760} />
        ) : (
          <TaskBoard tasks={data.tasks} />
        )}
      </section>
    </div>
  );
}
