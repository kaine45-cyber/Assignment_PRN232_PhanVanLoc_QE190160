import clsx, { type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

function parseDateOnly(value: string): Date | null {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** "2024-03-15" → "Mar 15, 2024" (date-only strings are parsed as local dates, no TZ shift). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = parseDateOnly(value);
  return date ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : value;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const startOfToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

/** A task is overdue when it has a due date in the past and is not Done/Cancelled. */
export function isOverdue(dueDate: string | null, status: number): boolean {
  if (!dueDate || status === 2 || status === 3) return false;
  const due = parseDateOnly(dueDate);
  return !!due && due < startOfToday();
}

/** Human friendly distance to a due date: "in 3 days", "2 months overdue", "today". */
export function dueDistance(dueDate: string | null): string {
  if (!dueDate) return "No due date";
  const due = parseDateOnly(dueDate);
  if (!due) return dueDate;
  const days = Math.round((due.getTime() - startOfToday().getTime()) / 86_400_000);
  if (days === 0) return "Due today";
  const abs = Math.abs(days);
  const unit = abs >= 365 ? [Math.round(abs / 365), "year"] : abs >= 30 ? [Math.round(abs / 30), "month"] : [abs, "day"];
  const text = `${unit[0]} ${unit[1]}${unit[0] === 1 ? "" : "s"}`;
  return days > 0 ? `Due in ${text}` : `${text} overdue`;
}

export const pct = (part: number, total: number) => (total === 0 ? 0 : Math.round((part / total) * 100));

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

const AVATAR_COLORS = [
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
];

/** Stable colour per id (department avatars). */
export const avatarColor = (id: number) => AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
