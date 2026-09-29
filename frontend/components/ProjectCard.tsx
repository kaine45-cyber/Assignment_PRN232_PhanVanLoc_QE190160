import Link from "next/link";
import { CalendarDays, ListChecks } from "lucide-react";
import type { Project } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ProjectStatusBadge } from "./Badges";
import DepartmentAvatar from "./DepartmentAvatar";

export default function ProjectCard({ project, showDepartment = true }: { project: Project; showDepartment?: boolean }) {
  return (
    <Link
      href={`/projects/${project.projectId}`}
      className="card group flex flex-col p-5 transition hover:border-border-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug text-fg group-hover:text-primary">{project.projectName}</h3>
        <ProjectStatusBadge status={project.status} />
      </div>
      <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{project.description || "No description provided."}</p>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted">
        {showDepartment ? (
          <span className="flex min-w-0 items-center gap-2">
            <DepartmentAvatar id={project.departmentId} name={project.departmentName} size="sm" />
            <span className="truncate text-fg-2">{project.departmentName}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(project.startDate)}
          </span>
        )}
        <span className="flex shrink-0 items-center gap-3">
          {showDepartment && (
            <span className="hidden items-center gap-1 sm:flex">
              <CalendarDays className="h-3.5 w-3.5" />
              {project.endDate ? formatDate(project.endDate) : "Ongoing"}
            </span>
          )}
          <span className="flex items-center gap-1">
            <ListChecks className="h-3.5 w-3.5" />
            <span className="tabular-nums">{project.taskCount}</span>
          </span>
        </span>
      </div>
    </Link>
  );
}
