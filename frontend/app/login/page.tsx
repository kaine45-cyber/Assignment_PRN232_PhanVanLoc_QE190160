"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Clock, LogIn } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import PasswordInput from "@/components/auth/PasswordInput";
import { useAuth } from "@/components/auth/AuthProvider";
import FormField from "@/components/ui/FormField";
import { Spinner } from "@/components/ui/Feedback";
import { ApiError, authApi, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
type Values = z.infer<typeof schema>;

/** Only allow internal redirects after login. */
const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin");

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, user, ready } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const next = safeNext(params.get("next"));
  const reason = params.get("reason");
  const registered = params.get("registered") === "1";

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.get("email") ?? "", password: "" },
  });

  // Already logged in → go straight to the destination.
  useEffect(() => {
    if (ready && user && !reason) router.replace(next);
  }, [ready, user, reason, next, router]);

  const onSubmit = async (values: Values) => {
    setError(null);
    try {
      const auth = await authApi.login(values);
      signIn(auth);
      toast.success(`Welcome back, ${auth.user.fullName}!`);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Incorrect email or password. Please try again." : errorMessage(err));
    }
  };

  return (
    <AuthCard
      title="Log in"
      subtitle="Sign in to manage departments, projects, tasks and tags."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      {registered && !error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> Account created. You can log in now.
        </div>
      )}
      {reason === "expired" && !error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300" role="status">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" /> Your session has expired. Please log in again.
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2.5 text-sm text-rose-700 dark:text-rose-300" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" autoFocus className={cn("input", errors.email && "input-error")} placeholder="you@example.com" {...register("email")} />
        </FormField>
        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" invalid={!!errors.password} placeholder="••••••••" {...register("password")} />
        </FormField>
        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : <LogIn className="h-4 w-4" />} Log in
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-muted">The first request may take up to a minute while the API wakes up.</p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
