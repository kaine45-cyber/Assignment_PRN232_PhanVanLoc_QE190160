"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import FormField from "@/components/FormField";
import { ActiveBadge, ProjectStatusBadge } from "@/components/Badges";
import { EmptyState, ErrorState, Spinner, TableSkeleton } from "@/components/Feedback";
import { departmentsApi, errorMessage, projectsApi } from "@/lib/api";
import { PROJECT_STATUS } from "@/lib/constants";
import { handleFormError } from "@/lib/forms";
import type { Project } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";
import { cn, formatDate } from "@/lib/utils";

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
type FormValues = z.infer<typeof schema>;
const FIELDS = ["projectName", "description", "startDate", "endDate", "status", "departmentId", "isActive"];
const EMPTY: FormValues = { projectName: "", description: "", startDate: "", endDate: "", status: "0", departmentId: "", isActive: true };

export default function ProjectManagePage() {
  const { data, loading, error, reload } = useFetch(() => projectsApi.list(true), []);
  const departments = useFetch(() => departmentsApi.list(true), []);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Project | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  const rows = useMemo(
    () => (data ?? []).filter((p) => p.projectName.toLowerCase().includes(filter.toLowerCase())),
    [data, filter],
  );

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY);
    setFormOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    reset({
      projectName: p.projectName,
      description: p.description ?? "",
      startDate: p.startDate,
      endDate: p.endDate ?? "",
      status: String(p.status),
      departmentId: String(p.departmentId),
      isActive: p.isActive,
    });
    setFormOpen(true);
  };

  const onSubmit = async (v: FormValues) => {
    const payload = {
      projectName: v.projectName,
      description: v.description.trim() || null,
      startDate: v.startDate,
      endDate: v.endDate || null,
      status: Number(v.status),
      departmentId: Number(v.departmentId),
      isActive: v.isActive,
    };
    try {
      if (editing) {
        await projectsApi.update(editing.projectId, payload);
        toast.success(`Project "${v.projectName}" updated.`);
      } else {
        await projectsApi.create(payload);
        toast.success(`Project "${v.projectName}" created.`);
      }
      setFormOpen(false);
      reload();
    } catch (err) {
      handleFormError(err, setError, FIELDS);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await projectsApi.remove(deleting.projectId);
      toast.success(`Project "${deleting.projectName}" deleted.`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(null);
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Manage" }, { label: "Projects" }]}
        title="Project management"
        description="Create, edit and delete projects. A project with tasks cannot be deleted."
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New project
          </button>
        }
      />

      <input className="input mb-4 max-w-sm" placeholder="Filter by name…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter" />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <TableSkeleton cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState title="No projects" />
      ) : (
        <div className={cn("card overflow-x-auto", loading && "opacity-60")}>
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Timeline</th>
                <th className="px-4 py-3 font-medium">Tasks</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => (
                <tr key={p.projectId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{p.projectId}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/projects/${p.projectId}`} className="hover:text-indigo-600">{p.projectName}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.departmentName}</td>
                  <td className="px-4 py-3"><ProjectStatusBadge status={p.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(p.startDate)} – {p.endDate ? formatDate(p.endDate) : "Ongoing"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.taskCount}</td>
                  <td className="px-4 py-3"><ActiveBadge active={p.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="btn btn-ghost px-2 py-1.5" onClick={() => openEdit(p)} aria-label={`Edit ${p.projectName}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="btn btn-ghost px-2 py-1.5 text-red-600 hover:bg-red-50" onClick={() => setDeleting(p)} aria-label={`Delete ${p.projectName}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={formOpen} onOpenChange={setFormOpen} title={editing ? "Edit project" : "New project"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Project name" htmlFor="projectName" required error={errors.projectName?.message}>
            <input id="projectName" className={cn("input", errors.projectName && "input-error")} {...register("projectName")} />
          </FormField>
          <FormField label="Description" htmlFor="description" error={errors.description?.message}>
            <textarea id="description" rows={3} className="input" {...register("description")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start date" htmlFor="startDate" required error={errors.startDate?.message}>
              <input id="startDate" type="date" className={cn("input", errors.startDate && "input-error")} {...register("startDate")} />
            </FormField>
            <FormField label="End date" htmlFor="endDate" error={errors.endDate?.message} hint="Leave empty if ongoing">
              <input id="endDate" type="date" className={cn("input", errors.endDate && "input-error")} {...register("endDate")} />
            </FormField>
            <FormField label="Status" htmlFor="status" required error={errors.status?.message}>
              <select id="status" className="input" {...register("status")}>
                {PROJECT_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Department" htmlFor="departmentId" required error={errors.departmentId?.message}>
              <select id="departmentId" className={cn("input", errors.departmentId && "input-error")} {...register("departmentId")}>
                <option value="">Select a department…</option>
                {departments.data?.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName}{d.isActive ? "" : " (inactive)"}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-indigo-600" {...register("isActive")} />
            Active
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting && <Spinner />} {editing ? "Save changes" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete project?"
        message={<>Are you sure you want to delete <b>{deleting?.projectName}</b>? This cannot be undone.</>}
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
