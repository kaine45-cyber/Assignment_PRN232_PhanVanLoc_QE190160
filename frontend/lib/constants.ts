export interface Option {
  value: number;
  label: string;
  /** Badge colours (work in light & dark mode). */
  badge: string;
  /** Solid dot / accent colour. */
  dot: string;
}

export const PROJECT_STATUS: Option[] = [
  { value: 0, label: "Not Started", badge: "bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:text-zinc-300", dot: "bg-zinc-400" },
  { value: 1, label: "In Progress", badge: "bg-blue-500/10 text-blue-700 ring-blue-500/25 dark:text-blue-300", dot: "bg-blue-500" },
  { value: 2, label: "Completed", badge: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300", dot: "bg-emerald-500" },
  { value: 3, label: "On Hold", badge: "bg-amber-500/10 text-amber-800 ring-amber-500/30 dark:text-amber-300", dot: "bg-amber-500" },
];

export const TASK_STATUS: Option[] = [
  { value: 0, label: "To Do", badge: "bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:text-zinc-300", dot: "bg-zinc-400" },
  { value: 1, label: "In Progress", badge: "bg-blue-500/10 text-blue-700 ring-blue-500/25 dark:text-blue-300", dot: "bg-blue-500" },
  { value: 2, label: "Done", badge: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300", dot: "bg-emerald-500" },
  { value: 3, label: "Cancelled", badge: "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300", dot: "bg-rose-500" },
];

export const TASK_PRIORITY: Option[] = [
  { value: 0, label: "Low", badge: "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20 dark:text-zinc-300", dot: "bg-zinc-400" },
  { value: 1, label: "Medium", badge: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300", dot: "bg-sky-500" },
  { value: 2, label: "High", badge: "bg-orange-500/10 text-orange-700 ring-orange-500/25 dark:text-orange-300", dot: "bg-orange-500" },
  { value: 3, label: "Critical", badge: "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300", dot: "bg-rose-500" },
];

export const findOption = (options: Option[], value: number): Option =>
  options.find((o) => o.value === value) ?? {
    value,
    label: `Unknown (${value})`,
    badge: "bg-zinc-500/10 text-zinc-500 ring-zinc-500/20",
    dot: "bg-zinc-400",
  };
