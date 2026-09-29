"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import TaskList from "@/components/TaskList";
import { EmptyState, ErrorState, Spinner, TableSkeleton } from "@/components/Feedback";
import { projectsApi, tagsApi, tasksApi } from "@/lib/api";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/constants";
import { useDebounce, useFetch } from "@/lib/useFetch";

const KEYS = ["title", "status", "priority", "projectId", "tagId"] as const;
type Filters = Record<(typeof KEYS)[number], string>;

function SearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => {
    const init = {} as Filters;
    KEYS.forEach((k) => (init[k] = params.get(k) ?? ""));
    return init;
  });
  const debouncedTitle = useDebounce(filters.title);
  const query = { ...filters, title: debouncedTitle };

  const projects = useFetch(() => projectsApi.list(), []);
  const tags = useFetch(() => tagsApi.list(), []);
  const { data, loading, error, reload } = useFetch(
    () => tasksApi.search(query),
    [debouncedTitle, filters.status, filters.priority, filters.projectId, filters.tagId],
  );

  // Keep filters in the URL so results can be shared / bookmarked.
  useEffect(() => {
    const sp = new URLSearchParams();
    KEYS.forEach((k) => {
      const v = k === "title" ? debouncedTitle : filters[k];
      if (v) sp.set(k, v);
    });
    const s = sp.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, filters.status, filters.priority, filters.projectId, filters.tagId]);

  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((f) => ({ ...f, [key]: e.target.value }));
  const hasFilters = KEYS.some((k) => filters[k]);

  return (
    <div>
      <PageHeader title="Search tasks" description="Filter by title, status, priority, project and tag. Results update as you type." />

      <div className="card mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Title…" value={filters.title} onChange={set("title")} aria-label="Title" />
          </div>
          <select className="input" value={filters.status} onChange={set("status")} aria-label="Status">
            <option value="">Any status</option>
            {TASK_STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select className="input" value={filters.priority} onChange={set("priority")} aria-label="Priority">
            <option value="">Any priority</option>
            {TASK_PRIORITY.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select className="input" value={filters.projectId} onChange={set("projectId")} aria-label="Project">
            <option value="">Any project</option>
            {projects.data?.map((p) => (
              <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
            ))}
          </select>
          <select className="input" value={filters.tagId} onChange={set("tagId")} aria-label="Tag">
            <option value="">Any tag</option>
            {tags.data?.map((t) => (
              <option key={t.tagId} value={t.tagId}>{t.tagName}</option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span className="flex items-center gap-2">
            {loading && <Spinner />}
            {data ? `${data.length} result${data.length === 1 ? "" : "s"}` : "Searching…"}
          </span>
          {hasFilters && (
            <button
              className="btn btn-ghost px-2 py-1"
              onClick={() => setFilters({ title: "", status: "", priority: "", projectId: "", tagId: "" })}
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <TableSkeleton />
      ) : data.length > 0 ? (
        <div className={loading ? "opacity-60 transition" : "transition"}>
          <TaskList tasks={data} showProject />
        </div>
      ) : (
        <EmptyState title="No tasks match your filters" description="Try removing a filter." />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}
