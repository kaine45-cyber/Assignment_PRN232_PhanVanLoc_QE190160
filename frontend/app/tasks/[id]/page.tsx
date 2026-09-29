"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { PriorityBadge, TagChip, TaskStatusBadge } from "@/components/Badges";
import { ErrorState, PageLoader } from "@/components/Feedback";
import { tasksApi } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-4 last:border-0 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0">{children}</dd>
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
    <div className="mx-auto max-w-3xl">
      <PageHeader
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: task.projectName, href: `/projects/${task.projectId}` },
          { label: `Task #${task.taskId}` },
        ]}
        title={task.title}
        actions={
          <>
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </>
        }
      />

      <dl className="card px-6">
        <Field label="Task ID">#{task.taskId}</Field>
        <Field label="Description">
          <p className="whitespace-pre-line">{task.description || <span className="text-slate-400">No description.</span>}</p>
        </Field>
        <Field label="Status"><TaskStatusBadge status={task.status} /></Field>
        <Field label="Priority"><PriorityBadge priority={task.priority} /></Field>
        <Field label="Due date">
          <span className={overdue ? "flex items-center gap-1 font-medium text-red-600" : ""}>
            {overdue && <AlertCircle className="h-4 w-4" />}
            {formatDate(task.dueDate)}
            {overdue && " (overdue)"}
          </span>
        </Field>
        <Field label="Project">
          <Link href={`/projects/${task.projectId}`} className="font-medium text-indigo-600 hover:underline">
            {task.projectName}
          </Link>
        </Field>
        <Field label="Tags">
          <div className="flex flex-wrap gap-1.5">
            {task.tags.length ? task.tags.map((g) => <TagChip key={g.tagId} tag={g} />) : <span className="text-slate-400">No tags</span>}
          </div>
        </Field>
        <Field label="Active">{task.isActive ? "Yes" : "No"}</Field>
        <Field label="Created">{formatDateTime(task.createdDate)}</Field>
        <Field label="Last modified">{formatDateTime(task.modifiedDate)}</Field>
      </dl>
    </div>
  );
}
