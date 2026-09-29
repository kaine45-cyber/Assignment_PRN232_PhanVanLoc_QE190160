"use client";

import { useEffect, useState } from "react";
import { checkHealth, API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";

type State = "checking" | "online" | "offline";

/** Small indicator showing whether the backend is reachable (Render free instances sleep). */
export default function ApiStatus() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const ok = await checkHealth();
      if (!cancelled) setState(ok ? "online" : "offline");
    };
    run();
    const t = setInterval(run, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const label = state === "online" ? "API online" : state === "offline" ? "API unreachable" : "Waking up API…";

  return (
    <a
      href={`${API_URL}/swagger`}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted transition hover:bg-subtle hover:text-fg"
      title="Open Swagger UI"
    >
      <span className="relative flex h-2 w-2">
        {state !== "offline" && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", state === "online" ? "bg-emerald-500" : "bg-amber-500")} />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", state === "online" ? "bg-emerald-500" : state === "offline" ? "bg-rose-500" : "bg-amber-500")} />
      </span>
      {label}
    </a>
  );
}
