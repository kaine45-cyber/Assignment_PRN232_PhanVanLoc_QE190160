"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, UserPlus } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import PasswordInput from "@/components/auth/PasswordInput";
import FormField from "@/components/ui/FormField";
import { Spinner } from "@/components/ui/Feedback";
import { authApi } from "@/lib/api";
import { handleFormError } from "@/lib/forms";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required.").max(100, "Max 100 characters."),
    email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address.").max(150, "Max 150 characters."),
    password: z.string().min(8, "Password must be at least 8 characters.").max(100, "Max 100 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
type Values = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [done, setDone] = useState<string | null>(null);
  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });
  const password = watch("password");

  const onSubmit = async (v: Values) => {
    try {
      const account = await authApi.register({ fullName: v.fullName, email: v.email, password: v.password });
      setDone(account.email);
      toast.success("Account created! Redirecting to login…");
      setTimeout(() => router.push(`/login?registered=1&email=${encodeURIComponent(account.email)}`), 1500);
    } catch (err) {
      handleFormError(err, setError, ["fullName", "email", "password"]);
    }
  };

  return (
    <AuthCard
      title="Create an account"
      subtitle="New accounts get the Staff role and can manage departments, projects, tasks and tags."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </span>
          <p className="font-semibold text-fg">Registration successful</p>
          <p className="text-sm text-muted">
            <b className="text-fg">{done}</b> is ready. Redirecting you to the login page…
          </p>
          <Spinner className="text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
            <input id="fullName" autoComplete="name" autoFocus className={cn("input", errors.fullName && "input-error")} placeholder="Nguyen Van A" {...register("fullName")} />
          </FormField>
          <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
            <input id="email" type="email" autoComplete="email" className={cn("input", errors.email && "input-error")} placeholder="you@example.com" {...register("email")} />
          </FormField>
          <FormField label="Password" htmlFor="password" required error={errors.password?.message} hint="At least 8 characters">
            <PasswordInput id="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
          </FormField>
          {password.length > 0 && (
            <div className="-mt-2 flex gap-1" aria-hidden>
              {[8, 10, 12].map((n, i) => (
                <span key={n} className={cn("h-1 flex-1 rounded-full", password.length >= n ? ["bg-amber-500", "bg-sky-500", "bg-emerald-500"][i] : "bg-border")} />
              ))}
            </div>
          )}
          <FormField label="Confirm password" htmlFor="confirmPassword" required error={errors.confirmPassword?.message}>
            <PasswordInput id="confirmPassword" autoComplete="new-password" invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
          </FormField>
          <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : <UserPlus className="h-4 w-4" />} Create account
          </button>
        </form>
      )}
    </AuthCard>
  );
}
