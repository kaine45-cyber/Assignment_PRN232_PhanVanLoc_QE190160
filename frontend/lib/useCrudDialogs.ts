"use client";

import { useState } from "react";
import { toast } from "sonner";
import { errorMessage } from "./api";

/** State for the create/edit modal and the delete confirmation used by every management page. */
export function useCrudDialogs<T>() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  return {
    formOpen,
    editing,
    deleting,
    deleteLoading,
    openCreate: () => {
      setEditing(null);
      setFormOpen(true);
    },
    openEdit: (item: T) => {
      setEditing(item);
      setFormOpen(true);
    },
    closeForm: () => setFormOpen(false),
    setFormOpen,
    askDelete: setDeleting,
    cancelDelete: () => setDeleting(null),
    /** Runs the delete, shows a toast for success or the API error (e.g. 400 "still has projects"). */
    confirmDelete: async (run: (item: T) => Promise<void>, successMessage: (item: T) => string, after: () => void) => {
      if (!deleting) return;
      setDeleteLoading(true);
      try {
        await run(deleting);
        toast.success(successMessage(deleting));
        after();
      } catch (err) {
        toast.error(errorMessage(err));
      } finally {
        setDeleteLoading(false);
        setDeleting(null);
      }
    },
  };
}
