"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Trash2 } from "lucide-react";
import { Spinner } from "./Feedback";

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Content
          role="alertdialog"
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 shadow-2xl focus:outline-none"
        >
          <div className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10">
              <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </span>
            <div>
              <Dialog.Title className="text-base font-semibold text-fg">{title}</Dialog.Title>
              <Dialog.Description asChild>
                <div className="mt-1 text-sm text-muted">{message}</div>
              </Dialog.Description>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" disabled={loading} onClick={() => onOpenChange(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" disabled={loading} onClick={onConfirm}>
              {loading && <Spinner />}
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
