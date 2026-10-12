import { NextResponse, type NextRequest } from "next/server";

/**
 * Server-side redirect for protected pages: without the session marker cookie, /admin/* and /profile
 * go straight to /login (no flash of protected UI). The real check (token validity, role) happens
 * client-side in <RequireAuth> and, ultimately, in the API (401 / 403).
 */
export function middleware(request: NextRequest) {
  if (request.cookies.get("tt_session")?.value) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/profile"],
};
