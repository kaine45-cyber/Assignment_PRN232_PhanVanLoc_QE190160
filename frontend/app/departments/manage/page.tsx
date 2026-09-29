"use client";

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
import { ActiveBadge } from "@/components/Badges";
import { EmptyState, ErrorState, Spinner, TableSkeleton } from "@/components/Feedback";
import { departmentsApi, errorMessage } from "@/lib/api";
import { handleFormError } from "@/lib/forms";
import type { Department } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";
import { cn } from "@/lib/utils";

const schema = z.object({
  departmentName: z.string().trim().min(1, "Department name is required.").max(100, "Max 100 characters."),
  departmentDescription: z.string().trim().min(1, "Description is required.").max(300, "Max 300 characters."),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;
const FIELDS = ["departmentName", "departmentDescription", "isActive"];

export default function DepartmentManagePage() {
  const { data, loading, error, reload } = useFetch(() => departmentsApi.list(true), []);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Department | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { departmentName: "", departmentDescription: "", isActive: true },
  });
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = form;

  const rows = useMemo(
    () => (data ?? []).filter((d) => d.departmentName.toLowerCase().includes(filter.toLowerCase())),
    [data, filter],
  );

  const openCreate = () => {
    setEditing(null);
    reset({ departmentName: "", departmentDescription: "", isActive: true });
    setFormOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditing(d);
    reset({ departmentName: d.departmentName, departmentDescription: d.departmentDescription, isActive: d.isActive });
    setFormOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editing) {
        await departmentsApi.update(editing.departmentId, values);
        toast.success(`Department "${values.departmentName}" updated.`);
      } else {
        await departmentsApi.create(values);
        toast.success(`Department "${values.departmentName}" created.`);
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
      await departmentsApi.remove(deleting.departmentId);
      toast.success(`Department "${deleting.departmentName}" deleted.`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Manage" }, { label: "Departments" }]}
        title="Department management"
        description="Create, edit and delete departments. A department with projects cannot be deleted."
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New department
          </button>
        }
      />

      <input className="input mb-4 max-w-sm" placeholder="Filter by name…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter" />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title="No departments" action={<button className="btn btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> New department</button>} />
      ) : (
        <div className={cn("card overflow-x-auto", loading && "opacity-60")}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Projects</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((d) => (
                <tr key={d.departmentId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{d.departmentId}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{d.departmentName}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={d.departmentDescription}>{d.departmentDescription}</td>
                  <td className="px-4 py-3 text-slate-600">{d.projectCount}</td>
                  <td className="px-4 py-3"><ActiveBadge active={d.isActive} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="btn btn-ghost px-2 py-1.5" onClick={() => openEdit(d)} aria-label={`Edit ${d.departmentName}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="btn btn-ghost px-2 py-1.5 text-red-600 hover:bg-red-50" onClick={() => setDeleting(d)} aria-label={`Delete ${d.departmentName}`}>
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

      <Modal open={formOpen} onOpenChange={setFormOpen} title={editing ? "Edit department" : "New department"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Name" htmlFor="departmentName" required error={errors.departmentName?.message}>
            <input id="departmentName" className={cn("input", errors.departmentName && "input-error")} {...register("departmentName")} />
          </FormField>
          <FormField label="Description" htmlFor="departmentDescription" required error={errors.departmentDescription?.message}>
            <textarea id="departmentDescription" rows={3} className={cn("input", errors.departmentDescription && "input-error")} {...register("departmentDescription")} />
          </FormField>
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
        title="Delete department?"
        message={<>Are you sure you want to delete <b>{deleting?.departmentName}</b>? This cannot be undone.</>}
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
