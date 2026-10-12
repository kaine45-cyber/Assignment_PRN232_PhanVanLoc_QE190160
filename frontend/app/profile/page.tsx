"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { KeyRound, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import PasswordInput from "@/components/auth/PasswordInput";
import { useAuth } from "@/components/auth/AuthProvider";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import { Spinner } from "@/components/ui/Feedback";
import { authApi } from "@/lib/api";
import { clearSession, updateStoredUser } from "@/lib/auth";
import { handleFormError } from "@/lib/forms";
import { cn, formatDateTime, initials } from "@/lib/utils";

const nameSchema = z.object({ fullName: z.string().trim().min(1, "Full name is required.").max(100, "Max 100 characters.") });
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters.").max(100, "Max 100 characters."),
    confirmPassword: z.string().min(1, "Please confirm the new password."),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ["newPassword"], message: "New password must be different." });

function ProfileContent() {
  const { user } = useAuth();
  const router = useRouter();

  const nameForm = useForm<z.infer<typeof nameSchema>>({ resolver: zodResolver(nameSchema), defaultValues: { fullName: user?.fullName ?? "" } });
  const pwForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const saveName = async (v: z.infer<typeof nameSchema>) => {
    try {
      const updated = await authApi.updateMe(v.fullName);
      updateStoredUser(updated);
      toast.success("Profile updated.");
    } catch (err) {
      handleFormError(err, nameForm.setError, ["fullName"]);
    }
  };

  const changePassword = async (v: z.infer<typeof passwordSchema>) => {
    try {
      await authApi.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword });
      // The API signs out every session after a password change.
      clearSession("password");
      toast.success("Password changed. Please log in with your new password.");
      router.replace(`/login?email=${encodeURIComponent(user?.email ?? "")}`);
    } catch (err) {
      handleFormError(err, pwForm.setError, ["currentPassword", "newPassword"]);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Profile" }]} title="My profile" description="Update your display name or change your password." />

      <div className="card flex items-center gap-4 p-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary">{initials(user.fullName)}</span>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-fg">{user.fullName}</p>
          <p className="truncate text-sm text-muted">{user.email}</p>
          <p className="mt-1 text-xs text-muted">
            {user.roleName} · member since {formatDateTime(user.createdDate)}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title={<span className="flex items-center gap-2"><UserRound className="h-4 w-4" /> Display name</span>} />
        <form onSubmit={nameForm.handleSubmit(saveName)} className="space-y-4 p-5" noValidate>
          <FormField label="Full name" htmlFor="fullName" required error={nameForm.formState.errors.fullName?.message}>
            <input id="fullName" className={cn("input", nameForm.formState.errors.fullName && "input-error")} {...nameForm.register("fullName")} />
          </FormField>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={nameForm.formState.isSubmitting}>
              {nameForm.formState.isSubmitting ? <Spinner /> : <Save className="h-4 w-4" />} Save name
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title={<span className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change password</span>} description="You will be signed out everywhere and asked to log in again." />
        <form onSubmit={pwForm.handleSubmit(changePassword)} className="space-y-4 p-5" noValidate>
          <FormField label="Current password" htmlFor="currentPassword" required error={pwForm.formState.errors.currentPassword?.message}>
            <PasswordInput id="currentPassword" autoComplete="current-password" invalid={!!pwForm.formState.errors.currentPassword} {...pwForm.register("currentPassword")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="New password" htmlFor="newPassword" required error={pwForm.formState.errors.newPassword?.message} hint="At least 8 characters">
              <PasswordInput id="newPassword" autoComplete="new-password" invalid={!!pwForm.formState.errors.newPassword} {...pwForm.register("newPassword")} />
            </FormField>
            <FormField label="Confirm new password" htmlFor="confirmPassword" required error={pwForm.formState.errors.confirmPassword?.message}>
              <PasswordInput id="confirmPassword" autoComplete="new-password" invalid={!!pwForm.formState.errors.confirmPassword} {...pwForm.register("confirmPassword")} />
            </FormField>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={pwForm.formState.isSubmitting}>
              {pwForm.formState.isSubmitting ? <Spinner /> : <KeyRound className="h-4 w-4" />} Change password
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
