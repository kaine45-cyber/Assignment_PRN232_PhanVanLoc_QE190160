"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
        <Dialog.Content
          role="alertdialog"
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none"
        >
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
              <Dialog.Description asChild>
                <div className="mt-1 text-sm text-slate-600">{message}</div>
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
