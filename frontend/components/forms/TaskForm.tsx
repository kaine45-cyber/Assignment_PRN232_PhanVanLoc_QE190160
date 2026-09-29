"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormField from "@/components/ui/FormField";
import { ModalFooter } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Feedback";
import TagMultiSelect from "@/components/TagMultiSelect";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/constants";
import { handleFormError } from "@/lib/forms";
import type { Project, Tag, Task, TaskRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(300, "Max 300 characters."),
  description: z.string(),
  status: z.string(),
  priority: z.string(),
  dueDate: z.string(),
  projectId: z.string().min(1, "Project is required."),
  tagIds: z.array(z.number()),
});
type Values = z.infer<typeof schema>;
const FIELDS = ["title", "description", "status", "priority", "dueDate", "projectId", "tagIds"];

export default function TaskForm({
  initial,
  projects,
  tags,
  defaultProjectId,
  onSubmit,
  onCancel,
}: {
  initial?: Task | null;
  projects: Project[];
  tags: Tag[];
  defaultProjectId?: number;
  onSubmit: (data: TaskRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      status: String(initial?.status ?? 0),
      priority: String(initial?.priority ?? 1),
      dueDate: initial?.dueDate ?? "",
      projectId: initial ? String(initial.projectId) : defaultProjectId ? String(defaultProjectId) : "",
      tagIds: initial?.tags.map((t) => t.tagId) ?? [],
    },
  });

  const submit = async (v: Values) => {
    try {
      await onSubmit({
        title: v.title,
        description: v.description.trim() || null,
        status: Number(v.status),
        priority: Number(v.priority),
        dueDate: v.dueDate || null,
        projectId: Number(v.projectId),
        tagIds: v.tagIds,
      });
    } catch (err) {
      handleFormError(err, setError, FIELDS);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <FormField label="Title" htmlFor="title" required error={errors.title?.message}>
        <input id="title" autoFocus className={cn("input", errors.title && "input-error")} placeholder="What needs to be done?" {...register("title")} />
      </FormField>
      <FormField label="Description" htmlFor="description" error={errors.description?.message}>
        <textarea id="description" rows={3} className="input" placeholder="Add more detail…" {...register("description")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Project" htmlFor="projectId" required error={errors.projectId?.message}>
          <select id="projectId" className={cn("input", errors.projectId && "input-error")} {...register("projectId")}>
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.projectName}
                {p.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Due date" htmlFor="dueDate" error={errors.dueDate?.message}>
          <input id="dueDate" type="date" className="input" {...register("dueDate")} />
        </FormField>
        <FormField label="Status" htmlFor="status" required error={errors.status?.message}>
          <select id="status" className="input" {...register("status")}>
            {TASK_STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Priority" htmlFor="priority" required error={errors.priority?.message}>
          <select id="priority" className="input" {...register("priority")}>
            {TASK_PRIORITY.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="Tags" htmlFor="tagIds" error={errors.tagIds?.message}>
        <Controller
          control={control}
          name="tagIds"
          render={({ field }) => <TagMultiSelect id="tagIds" tags={tags} value={field.value} onChange={field.onChange} />}
        />
      </FormField>
      <ModalFooter>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} {initial ? "Save changes" : "Create task"}
        </button>
      </ModalFooter>
    </form>
  );
}
