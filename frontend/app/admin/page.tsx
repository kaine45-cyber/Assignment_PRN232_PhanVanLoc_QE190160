"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, FolderKanban, ListTodo, Tags, UserCog, UserRound } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { ErrorState } from "@/components/ui/Feedback";
import { useAuth } from "@/components/auth/AuthProvider";
import { departmentsApi, projectsApi, tagsApi, tasksApi } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  const { data, loading, error, reload } = useFetch(async () => {
    const [departments, projects, tasks, tags] = await Promise.all([departmentsApi.list(), projectsApi.list(), tasksApi.list(), tagsApi.list()]);
    return { departments: departments.length, projects: projects.length, tasks: tasks.length, tags: tags.length };
  });

  const sections = [
    { href: "/admin/departments", label: "Departments", desc: "Create, edit and delete departments", icon: Building2 },
    { href: "/admin/projects", label: "Projects", desc: "Manage projects and their timelines", icon: FolderKanban },
    { href: "/admin/tasks", label: "Tasks", desc: "Create, edit, tag and soft-delete tasks", icon: ListTodo },
    { href: "/admin/tags", label: "Tags", desc: "Labels used to categorise tasks", icon: Tags },
    ...(isAdmin ? [{ href: "/admin/accounts", label: "Accounts", desc: "Manage users and roles (Admin only)", icon: UserCog }] : []),
    { href: "/profile", label: "My profile", desc: "Update your name or password", icon: UserRound },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Admin" }]}
        eyebrow={
          <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", isAdmin ? "bg-violet-500/10 text-violet-700 ring-violet-500/25 dark:text-violet-300" : "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300")}>
            {user?.roleName}
          </span>
        }
        title={`Welcome, ${user?.fullName ?? ""}`}
        description="Admin dashboard — manage everything in your workspace."
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary">
          <StatCard label="Departments" value={data?.departments} icon={Building2} loading={loading} hint="Active departments" />
          <StatCard label="Projects" value={data?.projects} icon={FolderKanban} loading={loading} hint="Active projects" />
          <StatCard label="Tasks" value={data?.tasks} icon={ListTodo} loading={loading} hint="Active tasks" />
          <StatCard label="Tags" value={data?.tags} icon={Tags} loading={loading} hint="Available tags" />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-base font-semibold text-fg">Management</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((s) => (
            <Link key={s.href} href={s.href} className="card group flex items-center gap-4 p-5 transition hover:border-border-strong hover:shadow-md">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-fg group-hover:text-primary">{s.label}</span>
                <span className="block truncate text-sm text-muted">{s.desc}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
