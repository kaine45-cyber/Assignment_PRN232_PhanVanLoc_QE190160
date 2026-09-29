import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="text-5xl font-bold text-indigo-600">404</p>
      <p className="text-lg font-medium text-slate-900">Page not found</p>
      <Link href="/" className="btn btn-primary mt-2">
        Back to home
      </Link>
    </div>
  );
}
