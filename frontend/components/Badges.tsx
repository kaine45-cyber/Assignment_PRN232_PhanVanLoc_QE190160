import { findOption, PROJECT_STATUS, TASK_PRIORITY, TASK_STATUS, type Option } from "@/lib/constants";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

function Badge({ option, className }: { option: Option; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        option.className,
        className,
      )}
    >
      {option.label}
    </span>
  );
}

export const ProjectStatusBadge = ({ status }: { status: number }) => <Badge option={findOption(PROJECT_STATUS, status)} />;

export const TaskStatusBadge = ({ status }: { status: number }) => <Badge option={findOption(TASK_STATUS, status)} />;

export function PriorityBadge({ priority }: { priority: number }) {
  const option = findOption(TASK_PRIORITY, priority);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        option.className,
      )}
    >
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("h-2.5 w-0.5 rounded-full bg-current", i > priority && "opacity-25")} />
        ))}
      </span>
      {option.label}
    </span>
  );
}

export function TagChip({ tag, className }: { tag: Pick<Tag, "tagName" | "color">; className?: string }) {
  const color = tag.color ?? "#64748B";
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium", className)}
      style={{ backgroundColor: `${color}1A`, color, border: `1px solid ${color}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {tag.tagName}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-500 ring-slate-400/20",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
