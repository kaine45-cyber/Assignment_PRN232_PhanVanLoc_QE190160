import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="font-mono text-sm text-primary">404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">Page not found</h1>
      <p className="text-sm text-muted">The page you are looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/" className="btn btn-primary mt-2">
        Back to dashboard
      </Link>
    </div>
  );
}
