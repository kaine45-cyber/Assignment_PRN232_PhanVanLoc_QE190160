import Link from "next/link";
import type { Column } from "@/components/ui/DataTable";
import type { Task } from "@/lib/types";
import { cn, dueDistance, formatDate, isOverdue } from "@/lib/utils";
import { PriorityBadge, TagChip, TaskStatusBadge } from "./Badges";

/** Shared column definitions for task tables (read-only + management). */
export function taskColumns(opts: { showProject?: boolean; showId?: boolean } = {}): Column<Task>[] {
  const cols: Column<Task>[] = [];
  if (opts.showId) {
    cols.push({ key: "id", header: "ID", cell: (t) => <span className="font-mono text-xs text-muted">#{t.taskId}</span>, sortValue: (t) => t.taskId, className: "w-16" });
  }
  cols.push({
    key: "title",
    header: "Task",
    sortValue: (t) => t.title.toLowerCase(),
    cell: (t) => (
      <div className="min-w-0 max-w-sm">
        <Link href={`/tasks/${t.taskId}`} className="font-medium text-fg hover:text-primary">
          {t.title}
        </Link>
        {opts.showProject && (
          <Link href={`/projects/${t.projectId}`} className="mt-0.5 block truncate text-xs text-muted hover:text-fg">
            {t.projectName}
          </Link>
        )}
      </div>
    ),
  });
  cols.push(
    { key: "status", header: "Status", sortValue: (t) => t.status, cell: (t) => <TaskStatusBadge status={t.status} /> },
    { key: "priority", header: "Priority", sortValue: (t) => t.priority, cell: (t) => <PriorityBadge priority={t.priority} /> },
    {
      key: "tags",
      header: "Tags",
      cell: (t) =>
        t.tags.length ? (
          <div className="flex max-w-[220px] flex-wrap gap-1">
            {t.tags.map((g) => (
              <TagChip key={g.tagId} tag={g} />
            ))}
          </div>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "due",
      header: "Due date",
      sortValue: (t) => t.dueDate,
      cell: (t) => {
        const overdue = isOverdue(t.dueDate, t.status);
        return (
          <div className="whitespace-nowrap">
            <p className={cn("text-fg-2", overdue && "font-medium text-rose-600 dark:text-rose-400")}>{formatDate(t.dueDate)}</p>
            {t.dueDate && t.status !== 2 && t.status !== 3 && (
              <p className={cn("text-xs", overdue ? "text-rose-600/80 dark:text-rose-400/80" : "text-muted")}>{dueDistance(t.dueDate)}</p>
            )}
          </div>
        );
      },
    },
  );
  return cols;
}

/** Compact card used for tasks on small screens. */
export function TaskMobileCard({ task: t, actions }: { task: Task; actions?: React.ReactNode }) {
  const overdue = isOverdue(t.dueDate, t.status);
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <Link href={`/tasks/${t.taskId}`} className="font-medium leading-snug text-fg hover:text-primary">
          {t.title}
        </Link>
        <p className="mt-0.5 truncate text-xs text-muted">
          #{t.taskId} · {t.projectName}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <TaskStatusBadge status={t.status} />
          <PriorityBadge priority={t.priority} />
          {t.tags.map((g) => (
            <TagChip key={g.tagId} tag={g} />
          ))}
        </div>
        <p className={cn("mt-2 text-xs", overdue ? "font-medium text-rose-600 dark:text-rose-400" : "text-muted")}>
          Due {formatDate(t.dueDate)}
          {overdue && ` · ${dueDistance(t.dueDate)}`}
        </p>
      </div>
      {actions && <div className="flex shrink-0 gap-0.5">{actions}</div>}
    </div>
  );
}
