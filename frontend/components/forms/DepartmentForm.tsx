"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormField from "@/components/ui/FormField";
import { ModalFooter } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Feedback";
import { handleFormError } from "@/lib/forms";
import type { Department, DepartmentRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

const schema = z.object({
  departmentName: z.string().trim().min(1, "Department name is required.").max(100, "Max 100 characters."),
  departmentDescription: z.string().trim().min(1, "Description is required.").max(300, "Max 300 characters."),
  isActive: z.boolean(),
});
type Values = z.infer<typeof schema>;

export default function DepartmentForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Department | null;
  onSubmit: (data: DepartmentRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      departmentName: initial?.departmentName ?? "",
      departmentDescription: initial?.departmentDescription ?? "",
      isActive: initial?.isActive ?? true,
    },
  });
  const description = watch("departmentDescription");

  const submit = async (v: Values) => {
    try {
      await onSubmit(v);
    } catch (err) {
      handleFormError(err, setError, Object.keys(schema.shape));
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <FormField label="Name" htmlFor="departmentName" required error={errors.departmentName?.message}>
        <input id="departmentName" autoFocus className={cn("input", errors.departmentName && "input-error")} placeholder="e.g. Engineering" {...register("departmentName")} />
      </FormField>
      <FormField
        label="Description"
        htmlFor="departmentDescription"
        required
        error={errors.departmentDescription?.message}
        hint={`${description?.length ?? 0}/300 characters`}
      >
        <textarea id="departmentDescription" rows={4} className={cn("input", errors.departmentDescription && "input-error")} placeholder="What does this department do?" {...register("departmentDescription")} />
      </FormField>
      <label className="flex items-start gap-3 rounded-lg border border-border p-3">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--primary)]" {...register("isActive")} />
        <span>
          <span className="block text-sm font-medium text-fg">Active</span>
          <span className="block text-xs text-muted">Inactive departments are hidden from public pages.</span>
        </span>
      </label>
      <ModalFooter>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} {initial ? "Save changes" : "Create department"}
        </button>
      </ModalFooter>
    </form>
  );
}
