"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, FolderKanban, ListTodo, Plus, Search } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import { PriorityBadge, TaskStatusBadge } from "@/components/Badges";
import BarList from "@/components/ui/BarList";
import { Card, CardHeader } from "@/components/ui/Card";
import { CardGridSkeleton, EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import Meter from "@/components/ui/Meter";
import StatCard from "@/components/ui/StatCard";
import { departmentsApi, projectsApi, tasksApi } from "@/lib/api";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/constants";
import { useFetch } from "@/lib/useFetch";
import { cn, dueDistance, isOverdue, pct } from "@/lib/utils";

export default function DashboardPage() {
  const { data, loading, error, reload } = useFetch(async () => {
    const [departments, projects, tasks] = await Promise.all([departmentsApi.list(), projectsApi.list(), tasksApi.list()]);
    return { departments, projects, tasks };
  });

  const stats = useMemo(() => {
    const tasks = data?.tasks ?? [];
    const done = tasks.filter((t) => t.status === 2).length;
    const open = tasks.filter((t) => t.status === 0 || t.status === 1).length;
    const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status));
    return {
      done,
      open,
      overdue,
      completion: pct(done, tasks.length),
      byStatus: TASK_STATUS.map((s) => ({
        key: s.value,
        label: s.label,
        value: tasks.filter((t) => t.status === s.value).length,
        href: `/search?status=${s.value}`,
        marker: <span className={cn("h-2 w-2 rounded-full", s.dot)} aria-hidden />,
      })),
      byPriority: [...TASK_PRIORITY].reverse().map((p) => ({
        key: p.value,
        label: p.label,
        value: tasks.filter((t) => t.priority === p.value).length,
        href: `/search?priority=${p.value}`,
        marker: <span className={cn("h-2 w-2 rounded-full", p.dot)} aria-hidden />,
      })),
      projectProgress: (data?.projects ?? []).map((p) => {
        const pt = tasks.filter((t) => t.projectId === p.projectId);
        return { project: p, total: pt.length, done: pt.filter((t) => t.status === 2).length };
      }),
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.12]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, var(--fg) 1px, transparent 0)", backgroundSize: "20px 20px" }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-fg-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Workspace overview
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">Welcome to TaskTrack</h1>
            <p className="mt-2 text-muted">
              Plan work across departments, follow project progress and find any task in seconds — all in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/search" className="btn btn-secondary">
              <Search className="h-4 w-4" /> Search tasks
            </Link>
            <Link href="/tasks/manage?new=1" className="btn btn-primary">
              <Plus className="h-4 w-4" /> New task
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          {/* KPI row */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary">
            <StatCard label="Departments" value={data?.departments.length} icon={Building2} loading={loading} hint="Active departments" />
            <StatCard label="Projects" value={data?.projects.length} icon={FolderKanban} loading={loading} hint="Active projects" />
            <StatCard
              label="Tasks"
              value={data?.tasks.length}
              icon={ListTodo}
              loading={loading}
              hint={
                <span>
                  <span className="text-fg-2">{stats.open}</span> open · <span className="text-fg-2">{stats.done}</span> done
                </span>
              }
            />
            <StatCard
              label="Overdue"
              value={stats.overdue.length}
              icon={AlertTriangle}
              tone={stats.overdue.length ? "critical" : "default"}
              loading={loading}
              hint="Open tasks past their due date"
            />
          </section>

          {/* Charts */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader title="Completion" description="Share of active tasks marked Done" />
              <div className="p-5">
                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-semibold tracking-tight text-fg tabular-nums">{stats.completion}%</span>
                      <CheckCircle2 className="mb-2 h-5 w-5 text-emerald-500" aria-hidden />
                    </div>
                    <Meter value={stats.completion} className="mt-4" label="Completion rate" />
                    <p className="mt-3 text-sm text-muted">
                      {stats.done} of {data?.tasks.length ?? 0} tasks completed
                    </p>
                  </>
                )}
              </div>
            </Card>
            <Card>
              <CardHeader title="Tasks by status" description="Click a row to see those tasks" />
              <div className="p-5">{loading ? <Skeleton className="h-32 w-full" /> : <BarList items={stats.byStatus} />}</div>
            </Card>
            <Card>
              <CardHeader title="Tasks by priority" description="Click a row to see those tasks" />
              <div className="p-5">{loading ? <Skeleton className="h-32 w-full" /> : <BarList items={stats.byPriority} />}</div>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader
                title="Project progress"
                description="Done tasks / all active tasks per project"
                action={
                  <Link href="/projects" className="text-xs font-medium text-primary hover:underline">
                    All projects
                  </Link>
                }
              />
              <ul className="divide-y divide-border">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <li key={i} className="px-5 py-4">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="mt-3 h-2 w-full" />
                      </li>
                    ))
                  : stats.projectProgress.map(({ project, total, done }) => (
                      <li key={project.projectId}>
                        <Link href={`/projects/${project.projectId}`} className="block px-5 py-3.5 transition hover:bg-subtle/60">
                          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                            <span className="truncate font-medium text-fg">{project.projectName}</span>
                            <span className="shrink-0 tabular-nums text-muted">
                              <span className="text-fg">{pct(done, total)}%</span> · {done}/{total}
                            </span>
                          </div>
                          <Meter value={pct(done, total)} label={`${project.projectName} progress`} />
                        </Link>
                      </li>
                    ))}
              </ul>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="Needs attention" description="Overdue open tasks, most urgent first" />
              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : stats.overdue.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="All caught up" description="No overdue tasks." />
              ) : (
                <ul className="divide-y divide-border">
                  {[...stats.overdue]
                    .sort((a, b) => b.priority - a.priority || (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
                    .slice(0, 6)
                    .map((t) => (
                      <li key={t.taskId}>
                        <Link href={`/tasks/${t.taskId}`} className="flex items-start justify-between gap-3 px-5 py-3 transition hover:bg-subtle/60">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-fg">{t.title}</p>
                            <p className="mt-0.5 truncate text-xs text-muted">
                              {t.projectName} · <span className="text-rose-600 dark:text-rose-400">{dueDistance(t.dueDate)}</span>
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <PriorityBadge priority={t.priority} />
                            <TaskStatusBadge status={t.status} />
                          </div>
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </Card>
          </section>

          {/* Active projects */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-fg">Active projects</h2>
              <Link href="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loading ? (
              <CardGridSkeleton count={3} />
            ) : data && data.projects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.projects.map((p) => (
                  <ProjectCard key={p.projectId} project={p} />
                ))}
              </div>
            ) : (
              <div className="card">
                <EmptyState title="No active projects yet" />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
