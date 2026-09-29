import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export default function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  eyebrow,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Crumb[];
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted" aria-label="Breadcrumb">
          {breadcrumbs.map((c, i) => (
            <span key={i} className="flex min-w-0 items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              {c.href ? (
                <Link href={c.href} className="truncate transition hover:text-fg">
                  {c.label}
                </Link>
              ) : (
                <span className="truncate text-fg-2">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="mb-2">{eyebrow}</div>}
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          {description && <div className="mt-1 text-sm text-muted">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
