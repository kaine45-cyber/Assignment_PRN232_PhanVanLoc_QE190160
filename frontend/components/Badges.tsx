import { CheckCircle2, Circle, CircleDashed, CirclePause, CircleX, LoaderCircle } from "lucide-react";
import { findOption, PROJECT_STATUS, TASK_PRIORITY, TASK_STATUS, type Option } from "@/lib/constants";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

const base = "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset";

const TASK_ICONS = [Circle, LoaderCircle, CheckCircle2, CircleX];
const PROJECT_ICONS = [CircleDashed, LoaderCircle, CheckCircle2, CirclePause];

function IconBadge({ option, Icon }: { option: Option; Icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <span className={cn(base, option.badge)}>
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {option.label}
    </span>
  );
}

export const TaskStatusBadge = ({ status }: { status: number }) => (
  <IconBadge option={findOption(TASK_STATUS, status)} Icon={TASK_ICONS[status]} />
);

export const ProjectStatusBadge = ({ status }: { status: number }) => (
  <IconBadge option={findOption(PROJECT_STATUS, status)} Icon={PROJECT_ICONS[status]} />
);

/** Priority badge with a 4-step signal indicator (not colour-only). */
export function PriorityBadge({ priority }: { priority: number }) {
  const option = findOption(TASK_PRIORITY, priority);
  return (
    <span className={cn(base, option.badge)}>
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-sm bg-current", i > priority && "opacity-25")} style={{ height: 4 + i * 2 }} />
        ))}
      </span>
      {option.label}
    </span>
  );
}

export function TagChip({ tag, className }: { tag: Pick<Tag, "tagName" | "color">; className?: string }) {
  const color = tag.color ?? "#71717A";
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-surface px-1.5 py-0.5 text-xs font-medium text-fg-2", className)}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {tag.tagName}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={cn(base, active ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300" : "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-zinc-400")} aria-hidden />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
