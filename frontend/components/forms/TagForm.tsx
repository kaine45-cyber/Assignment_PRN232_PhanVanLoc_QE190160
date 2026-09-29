"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormField from "@/components/ui/FormField";
import { ModalFooter } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Feedback";
import { TagChip } from "@/components/Badges";
import { handleFormError } from "@/lib/forms";
import type { Tag, TagRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

const HEX = /^#[0-9A-Fa-f]{6}$/;
const schema = z.object({
  tagName: z.string().trim().min(1, "Tag name is required.").max(50, "Max 50 characters."),
  color: z.string().trim().refine((v) => v === "" || HEX.test(v), "Color must be a hex code like #3B82F6."),
});
type Values = z.infer<typeof schema>;
const PRESETS = ["#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B", "#06B6D4", "#EC4899", "#6366F1", "#64748B"];

export default function TagForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Tag | null;
  onSubmit: (data: TagRequest) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, handleSubmit, setError, setValue, watch, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { tagName: initial?.tagName ?? "", color: initial?.color ?? "#3B82F6" },
  });
  const color = watch("color");
  const tagName = watch("tagName");

  const submit = async (v: Values) => {
    try {
      await onSubmit({ tagName: v.tagName, color: v.color || null });
    } catch (err) {
      handleFormError(err, setError, ["tagName", "color"]);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <FormField label="Tag name" htmlFor="tagName" required error={errors.tagName?.message}>
        <input id="tagName" autoFocus className={cn("input", errors.tagName && "input-error")} placeholder="e.g. frontend" {...register("tagName")} />
      </FormField>
      <FormField label="Color" htmlFor="color" error={errors.color?.message} hint="Hex code, e.g. #3B82F6">
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label="Pick color"
            className="h-9 w-11 cursor-pointer rounded-lg border border-border bg-surface p-1"
            value={HEX.test(color) ? color : "#000000"}
            onChange={(e) => setValue("color", e.target.value.toUpperCase(), { shouldValidate: true })}
          />
          <input id="color" className={cn("input font-mono uppercase", errors.color && "input-error")} placeholder="#3B82F6" {...register("color")} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              aria-label={`Use ${p}`}
              className={cn("h-6 w-6 rounded-full ring-offset-2 ring-offset-[var(--surface)] transition hover:scale-110", color?.toUpperCase() === p && "ring-2 ring-[var(--primary)]")}
              style={{ backgroundColor: p }}
              onClick={() => setValue("color", p, { shouldValidate: true })}
            />
          ))}
        </div>
      </FormField>
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted">
        Preview <TagChip tag={{ tagName: tagName || "tag-name", color: HEX.test(color) ? color : null }} />
      </div>
      <ModalFooter>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} {initial ? "Save changes" : "Create tag"}
        </button>
      </ModalFooter>
    </form>
  );
}
