"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Settings2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { TaskMobileCard, taskColumns } from "@/components/TaskColumns";
import DataTable from "@/components/ui/DataTable";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/Feedback";
import Segmented from "@/components/ui/Segmented";
import { tasksApi } from "@/lib/api";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/constants";
import { useFetch } from "@/lib/useFetch";
import { cn } from "@/lib/utils";

/** Task list with a status filter (bonus feature) plus priority / text filters. */
export default function TasksPage() {
  const { data, loading, error, reload } = useFetch(() => tasksApi.list(), []);
  const [status, setStatus] = useState<number | null>(null);
  const [priority, setPriority] = useState("");
  const [query, setQuery] = useState("");
  const columns = useMemo(() => taskColumns({ showProject: true, showId: true }), []);

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (t) =>
          (status === null || t.status === status) &&
          (priority === "" || t.priority === Number(priority)) &&
          t.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [data, status, priority, query],
  );
  const countFor = (s: number | null) => (data ?? []).filter((t) => s === null || t.status === s).length;

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Every active task. Filter by status, priority or title."
        actions={
          <Link href="/tasks/manage" className="btn btn-secondary">
            <Settings2 className="h-4 w-4" /> Manage
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Segmented
          ariaLabel="Filter by status"
          value={status}
          onChange={setStatus}
          options={[
            { value: null, label: "All", count: data ? countFor(null) : undefined },
            ...TASK_STATUS.map((s) => ({
              value: s.value as number | null,
              label: (
                <>
                  <span className={cn("h-2 w-2 rounded-full", s.dot)} aria-hidden />
                  {s.label}
                </>
              ),
              count: data ? countFor(s.value) : undefined,
            })),
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Filter by title…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter by title" />
          </div>
          <select className="input sm:w-40" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority">
            <option value="">Any priority</option>
            {TASK_PRIORITY.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(t) => t.taskId}
          mobileCard={(t) => <TaskMobileCard task={t} />}
          initialSort={{ key: "id", dir: "asc" }}
          empty={<EmptyState title="No tasks match these filters" description="Try another status or clear the filters." />}
        />
      )}
    </div>
  );
}
