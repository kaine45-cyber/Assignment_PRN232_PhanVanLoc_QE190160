import Link from "next/link";
import { Building2, CalendarDays, ListChecks } from "lucide-react";
import type { Project } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ProjectStatusBadge } from "./Badges";

export default function ProjectCard({ project, showDepartment = true }: { project: Project; showDepartment?: boolean }) {
  return (
    <Link
      href={`/projects/${project.projectId}`}
      className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700">{project.projectName}</h3>
        <ProjectStatusBadge status={project.status} />
      </div>
      <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-500">{project.description || "No description."}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {showDepartment && (
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" /> {project.departmentName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" /> {formatDate(project.startDate)} – {project.endDate ? formatDate(project.endDate) : "Ongoing"}
        </span>
        <span className="flex items-center gap-1">
          <ListChecks className="h-3.5 w-3.5" /> {project.taskCount} task{project.taskCount === 1 ? "" : "s"}
        </span>
      </div>
    </Link>
  );
}
