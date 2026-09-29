"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import FormField from "@/components/FormField";
import TagMultiSelect from "@/components/TagMultiSelect";
import { PriorityBadge, TagChip, TaskStatusBadge } from "@/components/Badges";
import { EmptyState, ErrorState, Spinner, TableSkeleton } from "@/components/Feedback";
import { errorMessage, projectsApi, tagsApi, tasksApi } from "@/lib/api";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/constants";
import { handleFormError } from "@/lib/forms";
import type { Task } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";
import { cn, formatDate, isOverdue } from "@/lib/utils";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(300, "Max 300 characters."),
  description: z.string(),
  status: z.string(),
  priority: z.string(),
  dueDate: z.string(),
  projectId: z.string().min(1, "Project is required."),
  tagIds: z.array(z.number()),
});
type FormValues = z.infer<typeof schema>;
const FIELDS = ["title", "description", "status", "priority", "dueDate", "projectId", "tagIds"];
const EMPTY: FormValues = { title: "", description: "", status: "0", priority: "1", dueDate: "", projectId: "", tagIds: [] };

export default function TaskManagePage() {
  const { data, loading, error, reload } = useFetch(() => tasksApi.list(), []);
  const projects = useFetch(() => projectsApi.list(true), []);
  const tags = useFetch(() => tagsApi.list(), []);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { register, control, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (t) =>
          t.title.toLowerCase().includes(filter.toLowerCase()) &&
          (statusFilter === "" || t.status === Number(statusFilter)),
      ),
    [data, filter, statusFilter],
  );

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY);
    setFormOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    reset({
      title: t.title,
      description: t.description ?? "",
      status: String(t.status),
      priority: String(t.priority),
      dueDate: t.dueDate ?? "",
      projectId: String(t.projectId),
      tagIds: t.tags.map((g) => g.tagId),
    });
    setFormOpen(true);
  };

  const onSubmit = async (v: FormValues) => {
    const payload = {
      title: v.title,
      description: v.description.trim() || null,
      status: Number(v.status),
      priority: Number(v.priority),
      dueDate: v.dueDate || null,
      projectId: Number(v.projectId),
      tagIds: v.tagIds,
    };
    try {
      if (editing) {
        await tasksApi.update(editing.taskId, payload);
        toast.success(`Task "${v.title}" updated.`);
      } else {
        await tasksApi.create(payload);
        toast.success(`Task "${v.title}" created.`);
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
      await tasksApi.remove(deleting.taskId);
      toast.success(`Task "${deleting.title}" deleted.`);
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
        breadcrumbs={[{ label: "Manage" }, { label: "Tasks" }]}
        title="Task management"
        description="Create, edit and delete tasks. Deleting a task is a soft delete (it is hidden, not removed)."
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New task
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input className="input sm:max-w-sm" placeholder="Filter by title…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by title" />
        <select className="input sm:max-w-[200px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {TASK_STATUS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <TableSkeleton cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState title="No tasks" />
      ) : (
        <div className={cn("card overflow-x-auto", loading && "opacity-60")}>
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => (
                <tr key={t.taskId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{t.taskId}</td>
                  <td className="max-w-xs px-4 py-3 font-medium text-slate-900">
                    <Link href={`/tasks/${t.taskId}`} className="hover:text-indigo-600">{t.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.projectName}</td>
                  <td className="px-4 py-3"><TaskStatusBadge status={t.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {t.tags.length ? t.tags.map((g) => <TagChip key={g.tagId} tag={g} />) : <span className="text-slate-400">—</span>}
                    </div>
                  </td>
                  <td className={cn("whitespace-nowrap px-4 py-3", isOverdue(t.dueDate, t.status) ? "font-medium text-red-600" : "text-slate-600")}>
                    {formatDate(t.dueDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="btn btn-ghost px-2 py-1.5" onClick={() => openEdit(t)} aria-label={`Edit ${t.title}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="btn btn-ghost px-2 py-1.5 text-red-600 hover:bg-red-50" onClick={() => setDeleting(t)} aria-label={`Delete ${t.title}`}>
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

      <Modal open={formOpen} onOpenChange={setFormOpen} title={editing ? "Edit task" : "New task"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Title" htmlFor="title" required error={errors.title?.message}>
            <input id="title" className={cn("input", errors.title && "input-error")} {...register("title")} />
          </FormField>
          <FormField label="Description" htmlFor="description" error={errors.description?.message}>
            <textarea id="description" rows={3} className="input" {...register("description")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Status" htmlFor="status" required error={errors.status?.message}>
              <select id="status" className="input" {...register("status")}>
                {TASK_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Priority" htmlFor="priority" required error={errors.priority?.message}>
              <select id="priority" className="input" {...register("priority")}>
                {TASK_PRIORITY.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Project" htmlFor="projectId" required error={errors.projectId?.message}>
              <select id="projectId" className={cn("input", errors.projectId && "input-error")} {...register("projectId")}>
                <option value="">Select a project…</option>
                {projects.data?.map((p) => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.projectName}{p.isActive ? "" : " (inactive)"}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Due date" htmlFor="dueDate" error={errors.dueDate?.message}>
              <input id="dueDate" type="date" className="input" {...register("dueDate")} />
            </FormField>
          </div>
          <FormField label="Tags" htmlFor="tagIds" error={errors.tagIds?.message}>
            <Controller
              control={control}
              name="tagIds"
              render={({ field }) => <TagMultiSelect id="tagIds" tags={tags.data ?? []} value={field.value} onChange={field.onChange} />}
            />
          </FormField>
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
        title="Delete task?"
        message={<>Delete <b>{deleting?.title}</b>? The task will be hidden (soft delete) but kept in the database.</>}
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
