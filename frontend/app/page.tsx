"use client";

import Link from "next/link";
import { ArrowRight, Building2, FolderKanban, ListChecks, Search } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import { CardGridSkeleton, EmptyState, ErrorState, Skeleton } from "@/components/Feedback";
import { departmentsApi, projectsApi, tasksApi } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";

export default function HomePage() {
  const { data, loading, error, reload } = useFetch(async () => {
    const [departments, projects, tasks] = await Promise.all([departmentsApi.list(), projectsApi.list(), tasksApi.list()]);
    return { departments, projects, tasks };
  });

  const stats = [
    { label: "Departments", value: data?.departments.length, icon: Building2, href: "/departments", color: "bg-violet-100 text-violet-700" },
    { label: "Projects", value: data?.projects.length, icon: FolderKanban, href: "/projects", color: "bg-indigo-100 text-indigo-700" },
    { label: "Tasks", value: data?.tasks.length, icon: ListChecks, href: "/tasks", color: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-10 text-white shadow-lg sm:px-10">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-medium text-indigo-200">Welcome to TaskTrack</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Plan, track and ship work across every team.</h1>
          <p className="mt-3 text-indigo-100">
            Browse departments, follow project progress and find any task in seconds.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/search" className="btn bg-white text-indigo-700 hover:bg-indigo-50">
              <Search className="h-4 w-4" /> Search tasks
            </Link>
            <Link href="/tasks/manage" className="btn border border-white/40 text-white hover:bg-white/10">
              Manage tasks <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-white/10" />
      </section>

      {error && <ErrorState message={error} onRetry={reload} />}

      {/* Summary counts */}
      {!error && (
        <section className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Link key={s.label} href={s.href} className="card flex items-center gap-4 p-5 transition hover:shadow-md">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </span>
              <div>
                {loading ? <Skeleton className="h-7 w-10" /> : <p className="text-2xl font-bold text-slate-900">{s.value}</p>}
                <p className="text-sm text-slate-500">Active {s.label.toLowerCase()}</p>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Active projects */}
      {!error && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Active projects</h2>
            <Link href="/projects" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all →
            </Link>
          </div>
          {loading ? (
            <CardGridSkeleton />
          ) : data && data.projects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.projects.map((p) => (
                <ProjectCard key={p.projectId} project={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="No active projects yet" />
          )}
        </section>
      )}
    </div>
  );
}
