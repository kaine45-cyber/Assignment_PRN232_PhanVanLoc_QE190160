import { avatarColor, cn, initials } from "@/lib/utils";

export default function DepartmentAvatar({ id, name, size = "md" }: { id: number; name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold",
        avatarColor(id),
        size === "sm" && "h-7 w-7 text-[11px]",
        size === "md" && "h-9 w-9 text-xs",
        size === "lg" && "h-12 w-12 text-sm",
      )}
    >
      {initials(name)}
    </span>
  );
}
