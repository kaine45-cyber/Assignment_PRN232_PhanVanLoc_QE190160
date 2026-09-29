import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { Task } from "@/lib/types";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import { PriorityBadge, TagChip, TaskStatusBadge } from "./Badges";

/** Read-only task table (desktop) / card list (mobile). */
export default function TaskList({ tasks, showProject = false }: { tasks: Task[]; showProject?: boolean }) {
  return (
    <>
      {/* Desktop table */}
      <div className="card hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              {showProject && <th className="px-4 py-3 font-medium">Project</th>}
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Due date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((t) => (
              <tr key={t.taskId} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/tasks/${t.taskId}`} className="font-medium text-slate-900 hover:text-indigo-600">
                    {t.title}
                  </Link>
                </td>
                {showProject && (
                  <td className="px-4 py-3">
                    <Link href={`/projects/${t.projectId}`} className="text-slate-600 hover:text-indigo-600">
                      {t.projectName}
                    </Link>
                  </td>
                )}
                <td className="px-4 py-3"><TaskStatusBadge status={t.status} /></td>
                <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {t.tags.length ? t.tags.map((g) => <TagChip key={g.tagId} tag={g} />) : <span className="text-slate-400">—</span>}
                  </div>
                </td>
                <td className={cn("whitespace-nowrap px-4 py-3", isOverdue(t.dueDate, t.status) ? "font-medium text-red-600" : "text-slate-600")}>
                  {formatDate(t.dueDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {tasks.map((t) => (
          <Link key={t.taskId} href={`/tasks/${t.taskId}`} className="card block p-4">
            <p className="font-medium text-slate-900">{t.title}</p>
            {showProject && <p className="mt-0.5 text-xs text-slate-500">{t.projectName}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <TaskStatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
            </div>
            {t.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {t.tags.map((g) => <TagChip key={g.tagId} tag={g} />)}
              </div>
            )}
            <p className={cn("mt-2 flex items-center gap-1 text-xs", isOverdue(t.dueDate, t.status) ? "text-red-600" : "text-slate-500")}>
              <CalendarDays className="h-3.5 w-3.5" /> Due {formatDate(t.dueDate)}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
