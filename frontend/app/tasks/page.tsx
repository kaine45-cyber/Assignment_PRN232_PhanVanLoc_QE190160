"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Settings } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import TaskList from "@/components/TaskList";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/Feedback";
import { tasksApi } from "@/lib/api";
import { TASK_STATUS } from "@/lib/constants";
import { useFetch } from "@/lib/useFetch";
import { cn } from "@/lib/utils";

/** Task list with a status filter (bonus feature). */
export default function TasksPage() {
  const { data, loading, error, reload } = useFetch(() => tasksApi.list(), []);
  const [status, setStatus] = useState<number | null>(null);

  const filtered = useMemo(() => (data ?? []).filter((t) => status === null || t.status === status), [data, status]);
  const countFor = (s: number | null) => (data ?? []).filter((t) => s === null || t.status === s).length;

  const tabs: { value: number | null; label: string }[] = [{ value: null, label: "All" }, ...TASK_STATUS.map((s) => ({ value: s.value, label: s.label }))];

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="All active tasks. Filter by status."
        actions={
          <Link href="/tasks/manage" className="btn btn-secondary">
            <Settings className="h-4 w-4" /> Manage
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {tabs.map((t) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={status === t.value}
            onClick={() => setStatus(t.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              status === t.value ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            {t.label}
            {data && <span className="ml-1.5 opacity-70">{countFor(t.value)}</span>}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <TableSkeleton />
      ) : filtered.length > 0 ? (
        <TaskList tasks={filtered} showProject />
      ) : (
        <EmptyState title="No tasks with this status" />
      )}
    </div>
  );
}
