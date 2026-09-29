"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { RowAction, type Column } from "@/components/ui/DataTable";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/Feedback";
import TagForm from "@/components/forms/TagForm";
import { TagChip } from "@/components/Badges";
import { tagsApi } from "@/lib/api";
import type { Tag } from "@/lib/types";
import { useCrudDialogs } from "@/lib/useCrudDialogs";
import { useFetch } from "@/lib/useFetch";

export default function TagManagePage() {
  const { data, loading, error, reload } = useFetch(() => tagsApi.list(), []);
  const crud = useCrudDialogs<Tag>();
  const [filter, setFilter] = useState("");
  const rows = useMemo(() => (data ?? []).filter((t) => t.tagName.toLowerCase().includes(filter.toLowerCase())), [data, filter]);

  const columns: Column<Tag>[] = [
    { key: "id", header: "ID", sortValue: (t) => t.tagId, className: "w-16", cell: (t) => <span className="font-mono text-xs text-muted">#{t.tagId}</span> },
    { key: "name", header: "Tag", sortValue: (t) => t.tagName, cell: (t) => <TagChip tag={t} /> },
    {
      key: "color",
      header: "Color",
      sortValue: (t) => t.color,
      cell: (t) => (
        <span className="flex items-center gap-2 font-mono text-xs text-fg-2">
          <span className="h-4 w-4 rounded border border-border" style={{ backgroundColor: t.color ?? "transparent" }} />
          {t.color ?? "—"}
        </span>
      ),
    },
    {
      key: "usage",
      header: "Used by",
      sortValue: (t) => t.taskCount,
      cell: (t) => (
        <span className="text-fg-2">
          <span className="tabular-nums">{t.taskCount}</span> task{t.taskCount === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (t) => (
        <div className="flex justify-end gap-0.5">
          <RowAction label={`Edit ${t.tagName}`} onClick={() => crud.openEdit(t)}>
            <Pencil className="h-4 w-4" />
          </RowAction>
          <RowAction label={`Delete ${t.tagName}`} danger onClick={() => crud.askDelete(t)}>
            <Trash2 className="h-4 w-4" />
          </RowAction>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Tags" }]}
        title="Tags"
        description="Labels used to categorise tasks. A tag that is used by any task cannot be deleted."
        actions={
          <button className="btn btn-primary" onClick={crud.openCreate}>
            <Plus className="h-4 w-4" /> New tag
          </button>
        }
      />

      <div className="relative mb-4 sm:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="input pl-9" placeholder="Filter tags…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter" />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <TableSkeleton cols={4} />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(t) => t.tagId}
          mobileCard={(t) => (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <TagChip tag={t} />
                <p className="mt-1.5 text-xs text-muted">
                  <span className="font-mono">{t.color ?? "no color"}</span> · used by {t.taskCount} task{t.taskCount === 1 ? "" : "s"}
                </p>
              </div>
              <RowAction label={`Edit ${t.tagName}`} onClick={() => crud.openEdit(t)}>
                <Pencil className="h-4 w-4" />
              </RowAction>
              <RowAction label={`Delete ${t.tagName}`} danger onClick={() => crud.askDelete(t)}>
                <Trash2 className="h-4 w-4" />
              </RowAction>
            </div>
          )}
          initialSort={{ key: "id", dir: "asc" }}
          minWidth={560}
          dimmed={loading}
          empty={<EmptyState title="No tags" />}
        />
      )}

      <Modal
        open={crud.formOpen}
        onOpenChange={crud.setFormOpen}
        title={crud.editing ? "Edit tag" : "New tag"}
        description={crud.editing ? `Update “${crud.editing.tagName}”.` : "Tag names must be unique."}
      >
        <TagForm
          key={crud.editing?.tagId ?? "new"}
          initial={crud.editing}
          onCancel={crud.closeForm}
          onSubmit={async (values) => {
            if (crud.editing) {
              await tagsApi.update(crud.editing.tagId, values);
              toast.success(`Tag “${values.tagName}” updated.`);
            } else {
              await tagsApi.create(values);
              toast.success(`Tag “${values.tagName}” created.`);
            }
            crud.closeForm();
            reload();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!crud.deleting}
        onOpenChange={(v) => !v && crud.cancelDelete()}
        title="Delete tag?"
        message={
          <>
            The tag <b className="text-fg">{crud.deleting?.tagName}</b> will be permanently deleted. Tags that are used by tasks cannot be deleted.
          </>
        }
        loading={crud.deleteLoading}
        onConfirm={() =>
          crud.confirmDelete(
            (t) => tagsApi.remove(t.tagId),
            (t) => `Tag “${t.tagName}” deleted.`,
            reload,
          )
        }
      />
    </div>
  );
}
