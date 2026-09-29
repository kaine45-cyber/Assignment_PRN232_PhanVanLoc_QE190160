"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, CalendarDays, Clock, FolderKanban, Pencil, RefreshCw } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { PriorityBadge, TagChip, TaskStatusBadge } from "@/components/Badges";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorState, PageLoader } from "@/components/ui/Feedback";
import { tasksApi } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { cn, dueDistance, formatDate, formatDateTime, isOverdue } from "@/lib/utils";

function Row({ label, icon: Icon, children }: { label: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3">
      <dt className="flex items-center gap-1.5 text-sm text-muted">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-fg">{children}</dd>
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: task, loading, error, reload } = useFetch(() => tasksApi.get(id), [id]);

  if (loading) return <PageLoader />;
  if (error || !task) return <ErrorState message={error ?? "Task not found."} onRetry={reload} />;

  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: task.projectName, href: `/projects/${task.projectId}` },
          { label: `Task #${task.taskId}` },
        ]}
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted">#{task.taskId}</span>
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
        }
        title={task.title}
        actions={
          <Link href="/tasks/manage" className="btn btn-secondary">
            <Pencil className="h-4 w-4" /> Manage tasks
          </Link>
        }
      />

      {overdue && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm text-rose-700 dark:text-rose-300" role="status">
          <AlertCircle className="h-4 w-4 shrink-0" />
          This task is overdue — it was due {formatDate(task.dueDate)} ({dueDistance(task.dueDate)}).
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Description" />
            <p className="whitespace-pre-line p-5 text-sm leading-relaxed text-fg-2">
              {task.description || <span className="text-muted">No description provided.</span>}
            </p>
          </Card>
          <Card>
            <CardHeader title="Tags" description={`${task.tags.length} tag${task.tags.length === 1 ? "" : "s"}`} />
            <div className="flex flex-wrap gap-1.5 p-5">
              {task.tags.length ? task.tags.map((g) => <TagChip key={g.tagId} tag={g} />) : <span className="text-sm text-muted">No tags</span>}
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Details" />
          <dl className="divide-y divide-border">
            <Row label="Task ID">#{task.taskId}</Row>
            <Row label="Status">
              <TaskStatusBadge status={task.status} />
            </Row>
            <Row label="Priority">
              <PriorityBadge priority={task.priority} />
            </Row>
            <Row label="Project" icon={FolderKanban}>
              <Link href={`/projects/${task.projectId}`} className="text-primary hover:underline">
                {task.projectName}
              </Link>
            </Row>
            <Row label="Due date" icon={CalendarDays}>
              <span className={cn(overdue && "text-rose-600 dark:text-rose-400")}>{formatDate(task.dueDate)}</span>
            </Row>
            <Row label="Active">{task.isActive ? "Yes" : "No"}</Row>
            <Row label="Created" icon={Clock}>
              {formatDateTime(task.createdDate)}
            </Row>
            <Row label="Last modified" icon={RefreshCw}>
              {formatDateTime(task.modifiedDate)}
            </Row>
          </dl>
        </Card>
      </div>
    </div>
  );
}
