import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { TASK_STATUS } from "@/lib/constants";
import type { Task } from "@/lib/types";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import { PriorityBadge, TagChip } from "./Badges";

/** Read-only Kanban board grouping tasks by status. */
export default function TaskBoard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUS.map((s) => {
        const items = tasks.filter((t) => t.status === s.value);
        return (
          <div key={s.value} className="flex min-h-40 flex-col rounded-xl border border-border bg-subtle/60 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="flex items-center gap-2 text-sm font-semibold text-fg">
                <span className={cn("h-2 w-2 rounded-full", s.dot)} aria-hidden />
                {s.label}
              </span>
              <span className="rounded-md bg-surface px-1.5 text-xs tabular-nums text-muted ring-1 ring-border">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-muted">No tasks</p>}
              {items.map((t) => {
                const overdue = isOverdue(t.dueDate, t.status);
                return (
                  <Link
                    key={t.taskId}
                    href={`/tasks/${t.taskId}`}
                    className="block rounded-lg border border-border bg-surface p-3 shadow-sm transition hover:border-border-strong hover:shadow"
                  >
                    <p className="text-sm font-medium leading-snug text-fg">{t.title}</p>
                    {t.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.tags.map((g) => (
                          <TagChip key={g.tagId} tag={g} />
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <PriorityBadge priority={t.priority} />
                      <span className={cn("flex items-center gap-1 text-xs", overdue ? "font-medium text-rose-600 dark:text-rose-400" : "text-muted")}>
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(t.dueDate)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
