"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { PageLoader } from "@/components/ui/Feedback";
import { getAccessToken, getRefreshToken, isTokenExpired, lastEndReason } from "@/lib/auth";
import { useAuth } from "./AuthProvider";

/**
 * Client-side guard for /admin/* and /profile.
 * - No session, or an expired access token without a refresh token → redirect to /login?next=…
 * - role="Admin" → Staff users see a 403 page instead of the content.
 */
export default function RequireAuth({ children, role }: { children: React.ReactNode; role?: "Admin" }) {
  const { user, ready, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const expired = ready && !!user && isTokenExpired(getAccessToken()) && !getRefreshToken();
  const allowed = ready && !!user && !expired;

  useEffect(() => {
    if (!ready || allowed) return;
    const ended = lastEndReason();
    // The code that ended the session is already navigating (logout → home, password change → login).
    if (ended === "logout" || ended === "password") return;
    const params = new URLSearchParams({ next: pathname });
    if (expired || ended === "expired") params.set("reason", "expired");
    router.replace(`/login?${params.toString()}`);
  }, [ready, allowed, expired, pathname, router]);

  if (!allowed) return <PageLoader label="Checking your session…" />;

  if (role === "Admin" && !isAdmin) {
    return (
      <div className="card mx-auto mt-10 flex max-w-lg flex-col items-center gap-3 px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </span>
        <p className="font-mono text-xs text-muted">403 · Forbidden</p>
        <h1 className="text-lg font-semibold text-fg">Admins only</h1>
        <p className="text-sm text-muted">Your account ({user?.roleName}) does not have permission to manage accounts.</p>
        <Link href="/admin" className="btn btn-secondary mt-2">
          Back to admin dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
