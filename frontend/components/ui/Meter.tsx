import { cn } from "@/lib/utils";

/** Single ratio against 100% — same-ramp track + fill, 4px rounded ends. */
export default function Meter({ value, className, label }: { value: number; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-series-1-track", className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      aria-label={label}
    >
      <div className="h-full rounded-full bg-series-1 transition-[width] duration-500" style={{ width: `${v}%` }} />
    </div>
  );
}
