import Link from "next/link";
import { ListChecks } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";

/** Centered card layout shared by /login and /register. */
export default function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.1]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, var(--fg) 1px, transparent 0)", backgroundSize: "22px 22px" }}
      />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Link href="/" className="relative mb-8 flex items-center gap-2.5 text-lg font-semibold tracking-tight text-fg">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
          <ListChecks className="h-4 w-4" />
        </span>
        TaskTrack
      </Link>
      <div className="card relative w-full max-w-md p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
      <div className="relative mt-6 text-sm text-muted">{footer}</div>
    </div>
  );
}
