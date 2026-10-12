"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi, refreshSession } from "@/lib/api";
import { AUTH_EVENT, clearSession, resetEndReason, getRefreshToken, getSession, loginUrl, saveSession, tokenExpiry, type Session } from "@/lib/auth";
import type { Account, AuthResponse } from "@/lib/types";

interface AuthContextValue {
  /** Logged-in user, or null. */
  user: Account | null;
  isAdmin: boolean;
  /** False until the session has been read from storage (avoids redirect flicker). */
  ready: boolean;
  signIn: (auth: AuthResponse) => void;
  signOut: (options?: { silent?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  useEffect(() => resetEndReason(), [pathname]);

  // Read the session on mount and whenever it changes (this tab or another tab).
  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    setReady(true);
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Token expiry: shortly before the access token's "exp", refresh it silently.
  // If the refresh fails (refresh token expired / revoked), end the session and go to /login.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const exp = tokenExpiry(session?.accessToken ?? null);
    if (!session || !exp) return;
    const delay = Math.max(0, exp - Date.now() - 60_000);
    timer.current = setTimeout(async () => {
      if (await refreshSession()) return;
      const onProtectedPage = /^\/(admin|profile)(\/|$)/.test(window.location.pathname);
      const target = loginUrl("expired");
      clearSession("expired");
      toast.error("Your session has expired. Please log in again.");
      if (onProtectedPage) router.replace(target);
    }, Math.min(delay, 2_147_000_000));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [session, router]);

  const signIn = useCallback((auth: AuthResponse) => saveSession(auth), []);

  const signOut = useCallback(
    async (options?: { silent?: boolean }) => {
      const refresh = getRefreshToken();
      clearSession("logout");
      if (refresh) authApi.logout(refresh).catch(() => undefined); // revoke the refresh token (best effort)
      if (!options?.silent) toast.success("You have been logged out.");
      router.push("/");
    },
    [router],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, isAdmin: session?.user.roleName === "Admin", ready, signIn, signOut }),
    [session, ready, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
