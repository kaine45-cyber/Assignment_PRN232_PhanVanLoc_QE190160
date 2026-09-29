"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import FormField from "@/components/FormField";
import { TagChip } from "@/components/Badges";
import { EmptyState, ErrorState, Spinner, TableSkeleton } from "@/components/Feedback";
import { errorMessage, tagsApi } from "@/lib/api";
import { handleFormError } from "@/lib/forms";
import type { Tag } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";
import { cn } from "@/lib/utils";

const HEX = /^#[0-9A-Fa-f]{6}$/;
const schema = z.object({
  tagName: z.string().trim().min(1, "Tag name is required.").max(50, "Max 50 characters."),
  color: z.string().trim().refine((v) => v === "" || HEX.test(v), "Color must be a hex code like #3B82F6."),
});
type FormValues = z.infer<typeof schema>;
const FIELDS = ["tagName", "color"];
const PRESETS = ["#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B", "#06B6D4", "#EC4899", "#64748B"];

export default function TagManagePage() {
  const { data, loading, error, reload } = useFetch(() => tagsApi.list(), []);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Tag | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { register, handleSubmit, reset, setError, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tagName: "", color: "#3B82F6" },
  });
  const color = watch("color");
  const tagName = watch("tagName");

  const openCreate = () => {
    setEditing(null);
    reset({ tagName: "", color: "#3B82F6" });
    setFormOpen(true);
  };

  const openEdit = (t: Tag) => {
    setEditing(t);
    reset({ tagName: t.tagName, color: t.color ?? "" });
    setFormOpen(true);
  };

  const onSubmit = async (v: FormValues) => {
    const payload = { tagName: v.tagName, color: v.color || null };
    try {
      if (editing) {
        await tagsApi.update(editing.tagId, payload);
        toast.success(`Tag "${v.tagName}" updated.`);
      } else {
        await tagsApi.create(payload);
        toast.success(`Tag "${v.tagName}" created.`);
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
      await tagsApi.remove(deleting.tagId);
      toast.success(`Tag "${deleting.tagName}" deleted.`);
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
        breadcrumbs={[{ label: "Manage" }, { label: "Tags" }]}
        title="Tag management"
        description="Create, edit and delete tags. A tag that is used by any task cannot be deleted."
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New tag
          </button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <TableSkeleton cols={4} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No tags" />
      ) : (
        <div className={cn("card overflow-x-auto", loading && "opacity-60")}>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Tag</th>
                <th className="px-4 py-3 font-medium">Color</th>
                <th className="px-4 py-3 font-medium">Used by</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((t) => (
                <tr key={t.tagId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{t.tagId}</td>
                  <td className="px-4 py-3"><TagChip tag={t} /></td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-mono text-xs text-slate-600">
                      <span className="h-4 w-4 rounded border border-slate-200" style={{ backgroundColor: t.color ?? "transparent" }} />
                      {t.color ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.taskCount} task{t.taskCount === 1 ? "" : "s"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="btn btn-ghost px-2 py-1.5" onClick={() => openEdit(t)} aria-label={`Edit ${t.tagName}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="btn btn-ghost px-2 py-1.5 text-red-600 hover:bg-red-50" onClick={() => setDeleting(t)} aria-label={`Delete ${t.tagName}`}>
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

      <Modal open={formOpen} onOpenChange={setFormOpen} title={editing ? "Edit tag" : "New tag"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Tag name" htmlFor="tagName" required error={errors.tagName?.message}>
            <input id="tagName" className={cn("input", errors.tagName && "input-error")} {...register("tagName")} />
          </FormField>
          <FormField label="Color" htmlFor="color" error={errors.color?.message} hint="Hex code, e.g. #3B82F6">
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick color"
                className="h-10 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                value={HEX.test(color) ? color : "#000000"}
                onChange={(e) => setValue("color", e.target.value.toUpperCase(), { shouldValidate: true })}
              />
              <input id="color" className={cn("input font-mono", errors.color && "input-error")} placeholder="#3B82F6" {...register("color")} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-label={`Use ${p}`}
                  className="h-6 w-6 rounded-full border-2 border-white shadow ring-1 ring-slate-200"
                  style={{ backgroundColor: p }}
                  onClick={() => setValue("color", p, { shouldValidate: true })}
                />
              ))}
            </div>
          </FormField>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            Preview: <TagChip tag={{ tagName: tagName || "tag-name", color: HEX.test(color) ? color : null }} />
          </div>
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
        title="Delete tag?"
        message={<>Are you sure you want to delete the tag <b>{deleting?.tagName}</b>?</>}
        loading={deleteLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
