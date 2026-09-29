"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Search, SearchX } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { TaskMobileCard, taskColumns } from "@/components/TaskColumns";
import DataTable from "@/components/ui/DataTable";
import { EmptyState, ErrorState, Spinner, TableSkeleton } from "@/components/ui/Feedback";
import { projectsApi, tagsApi, tasksApi } from "@/lib/api";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/constants";
import { useDebounce, useFetch } from "@/lib/useFetch";

const KEYS = ["title", "status", "priority", "projectId", "tagId"] as const;
type Filters = Record<(typeof KEYS)[number], string>;
const EMPTY: Filters = { title: "", status: "", priority: "", projectId: "", tagId: "" };

function SearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const columns = useMemo(() => taskColumns({ showProject: true }), []);

  const readParams = () => {
    const init = { ...EMPTY };
    KEYS.forEach((k) => (init[k] = params.get(k) ?? ""));
    return init;
  };
  const [filters, setFilters] = useState<Filters>(readParams);

  // Pick up changes coming from outside (e.g. the global search box in the top bar).
  const paramString = params.toString();
  const lastWritten = useRef(paramString);
  useEffect(() => {
    if (paramString === lastWritten.current) return; // our own URL update
    lastWritten.current = paramString;
    setFilters(readParams());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramString]);

  const debouncedTitle = useDebounce(filters.title);
  const projects = useFetch(() => projectsApi.list(), []);
  const tags = useFetch(() => tagsApi.list(), []);
  const { data, loading, error, reload } = useFetch(
    () => tasksApi.search({ ...filters, title: debouncedTitle }),
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
    if (s !== paramString) {
      lastWritten.current = s;
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, filters.status, filters.priority, filters.projectId, filters.tagId]);

  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const active = KEYS.filter((k) => filters[k]).length;

  return (
    <div>
      <PageHeader title="Search tasks" description="Combine any filters — results update as you type." />

      <div className="card mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.3fr_1fr]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Title contains…" value={filters.title} onChange={set("title")} aria-label="Title" />
          </div>
          <select className="input" value={filters.status} onChange={set("status")} aria-label="Status">
            <option value="">Any status</option>
            {TASK_STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select className="input" value={filters.priority} onChange={set("priority")} aria-label="Priority">
            <option value="">Any priority</option>
            {TASK_PRIORITY.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select className="input" value={filters.projectId} onChange={set("projectId")} aria-label="Project">
            <option value="">Any project</option>
            {projects.data?.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.projectName}
              </option>
            ))}
          </select>
          <select className="input" value={filters.tagId} onChange={set("tagId")} aria-label="Tag">
            <option value="">Any tag</option>
            {tags.data?.map((t) => (
              <option key={t.tagId} value={t.tagId}>
                {t.tagName}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm text-muted">
          <span className="flex items-center gap-2" aria-live="polite">
            {loading && <Spinner />}
            {data ? (
              <span>
                <span className="font-medium text-fg tabular-nums">{data.length}</span> {data.length === 1 ? "result" : "results"}
                {active > 0 && ` · ${active} ${active === 1 ? "filter" : "filters"} applied`}
              </span>
            ) : (
              "Searching…"
            )}
          </span>
          {active > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters(EMPTY)}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <TableSkeleton />
      ) : (
        <DataTable
          rows={data}
          columns={columns}
          rowKey={(t) => t.taskId}
          mobileCard={(t) => <TaskMobileCard task={t} />}
          dimmed={loading}
          empty={<EmptyState icon={SearchX} title="No tasks match your filters" description="Try removing a filter or searching for a different title." />}
        />
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
