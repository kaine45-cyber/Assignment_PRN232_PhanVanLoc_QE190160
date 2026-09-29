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
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: Crumb[];
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-slate-500" aria-label="Breadcrumb">
          {breadcrumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {c.href ? (
                <Link href={c.href} className="hover:text-indigo-600">
                  {c.label}
                </Link>
              ) : (
                <span className="text-slate-700">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {description && <div className="mt-1 text-sm text-slate-500">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
