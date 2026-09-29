import { cn } from "@/lib/utils";
import { Skeleton } from "./Feedback";

/** KPI tile: label, headline value, optional hint line. */
export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  tone?: "default" | "critical";
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            tone === "critical" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-primary-soft text-primary",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-16" />
      ) : (
        <p className="mt-2 text-3xl font-semibold tracking-tight text-fg tabular-nums">{value}</p>
      )}
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
