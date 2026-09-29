"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormField from "@/components/ui/FormField";
import { ModalFooter } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Feedback";
import { PROJECT_STATUS } from "@/lib/constants";
import { handleFormError } from "@/lib/forms";
import type { Department, Project, ProjectRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    projectName: z.string().trim().min(1, "Project name is required.").max(200, "Max 200 characters."),
    description: z.string(),
    startDate: z.string().min(1, "Start date is required."),
    endDate: z.string(),
    status: z.string(),
    departmentId: z.string().min(1, "Department is required."),
    isActive: z.boolean(),
  })
  .refine((v) => !v.endDate || !v.startDate || v.endDate >= v.startDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date.",
  });
type Values = z.infer<typeof schema>;
const FIELDS = ["projectName", "description", "startDate", "endDate", "status", "departmentId", "isActive"];

export default function ProjectForm({
  initial,
  departments,
  onSubmit,
  onCancel,
}: {
  initial?: Project | null;
  departments: Department[];
  onSubmit: (data: ProjectRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectName: initial?.projectName ?? "",
      description: initial?.description ?? "",
      startDate: initial?.startDate ?? "",
      endDate: initial?.endDate ?? "",
      status: String(initial?.status ?? 0),
      departmentId: initial ? String(initial.departmentId) : "",
      isActive: initial?.isActive ?? true,
    },
  });

  const submit = async (v: Values) => {
    try {
      await onSubmit({
        projectName: v.projectName,
        description: v.description.trim() || null,
        startDate: v.startDate,
        endDate: v.endDate || null,
        status: Number(v.status),
        departmentId: Number(v.departmentId),
        isActive: v.isActive,
      });
    } catch (err) {
      handleFormError(err, setError, FIELDS);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <FormField label="Project name" htmlFor="projectName" required error={errors.projectName?.message}>
        <input id="projectName" autoFocus className={cn("input", errors.projectName && "input-error")} placeholder="e.g. Portal Redesign" {...register("projectName")} />
      </FormField>
      <FormField label="Description" htmlFor="description" error={errors.description?.message}>
        <textarea id="description" rows={3} className="input" placeholder="Goals, scope, notes…" {...register("description")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Department" htmlFor="departmentId" required error={errors.departmentId?.message}>
          <select id="departmentId" className={cn("input", errors.departmentId && "input-error")} {...register("departmentId")}>
            <option value="">Select a department…</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.departmentName}
                {d.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Status" htmlFor="status" required error={errors.status?.message}>
          <select id="status" className="input" {...register("status")}>
            {PROJECT_STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Start date" htmlFor="startDate" required error={errors.startDate?.message}>
          <input id="startDate" type="date" className={cn("input", errors.startDate && "input-error")} {...register("startDate")} />
        </FormField>
        <FormField label="End date" htmlFor="endDate" error={errors.endDate?.message} hint="Leave empty if ongoing">
          <input id="endDate" type="date" className={cn("input", errors.endDate && "input-error")} {...register("endDate")} />
        </FormField>
      </div>
      <label className="flex items-start gap-3 rounded-lg border border-border p-3">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--primary)]" {...register("isActive")} />
        <span>
          <span className="block text-sm font-medium text-fg">Active</span>
          <span className="block text-xs text-muted">Inactive projects are hidden from public pages.</span>
        </span>
      </label>
      <ModalFooter>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} {initial ? "Save changes" : "Create project"}
        </button>
      </ModalFooter>
    </form>
  );
}
