/**
 * Client-side session storage.
 * - Access token (JWT, 24h) + refresh token are kept in localStorage.
 * - A non-sensitive marker cookie "tt_session" lets middleware.ts redirect /admin/* on the server
 *   (it contains no token — the API never trusts it).
 */
import type { Account, AuthResponse } from "./types";

const ACCESS = "tt_access";
const REFRESH = "tt_refresh";
const USER = "tt_user";
export const SESSION_COOKIE = "tt_session";
export const AUTH_EVENT = "tt-auth-change";

export interface Session {
  accessToken: string;
  refreshToken: string | null;
  user: Account;
}

const isBrowser = () => typeof window !== "undefined";

function safeGet(key: string): string | null {
  try {
    return isBrowser() ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null) {
  try {
    if (!isBrowser()) return;
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked — session lasts for this page only */
  }
}

function notify() {
  if (isBrowser()) window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getSession(): Session | null {
  const accessToken = safeGet(ACCESS);
  const raw = safeGet(USER);
  if (!accessToken || !raw) return null;
  try {
    return { accessToken, refreshToken: safeGet(REFRESH), user: JSON.parse(raw) as Account };
  } catch {
    return null;
  }
}

export const getAccessToken = () => safeGet(ACCESS);
export const getRefreshToken = () => safeGet(REFRESH);

/**
 * Why the last session ended. Read by the route guard so that it does not race the code that ended
 * the session: after a logout it lets the logout navigate home, after an expiry it adds ?reason=expired.
 */
export type EndReason = "logout" | "expired" | "password";
let endReason: EndReason | null = null;
export const lastEndReason = () => endReason;
/** Called on every route change: the reason only matters until the navigation it caused has happened. */
export const resetEndReason = () => void (endReason = null);

export function saveSession(auth: AuthResponse) {
  endReason = null;
  safeSet(ACCESS, auth.accessToken);
  safeSet(REFRESH, auth.refreshToken);
  safeSet(USER, JSON.stringify(auth.user));
  const maxAge = Math.max(60, Math.round((new Date(auth.refreshTokenExpiresAt).getTime() - Date.now()) / 1000));
  document.cookie = `${SESSION_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  notify();
}

export function updateStoredUser(user: Account) {
  safeSet(USER, JSON.stringify(user));
  notify();
}

export function clearSession(reason: EndReason | null = null) {
  endReason = reason;
  safeSet(ACCESS, null);
  safeSet(REFRESH, null);
  safeSet(USER, null);
  if (isBrowser()) document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  notify();
}

/** Decodes the JWT payload (no signature check — the API validates the token). */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "="));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

/** Milliseconds since epoch when the access token expires (from the "exp" claim). */
export function tokenExpiry(token: string | null): number | null {
  if (!token) return null;
  const exp = decodeJwt(token)?.exp;
  return typeof exp === "number" ? exp * 1000 : null;
}

export function isTokenExpired(token: string | null, skewMs = 0): boolean {
  const exp = tokenExpiry(token);
  return exp === null || exp - skewMs <= Date.now();
}

/** Builds /login?next=…&reason=… for redirects. */
export function loginUrl(reason?: "expired" | "required") {
  if (!isBrowser()) return "/login";
  const here = window.location.pathname + window.location.search;
  const params = new URLSearchParams();
  if (here && here !== "/" && !here.startsWith("/login")) params.set("next", here);
  if (reason) params.set("reason", reason);
  const s = params.toString();
  return s ? `/login?${s}` : "/login";
}
