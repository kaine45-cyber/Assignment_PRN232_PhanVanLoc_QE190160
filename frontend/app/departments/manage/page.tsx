"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { RowAction, type Column } from "@/components/ui/DataTable";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/Feedback";
import Segmented from "@/components/ui/Segmented";
import DepartmentForm from "@/components/forms/DepartmentForm";
import DepartmentAvatar from "@/components/DepartmentAvatar";
import { ActiveBadge } from "@/components/Badges";
import { departmentsApi } from "@/lib/api";
import type { Department } from "@/lib/types";
import { useCrudDialogs } from "@/lib/useCrudDialogs";
import { useFetch } from "@/lib/useFetch";

export default function DepartmentManagePage() {
  const { data, loading, error, reload } = useFetch(() => departmentsApi.list(true), []);
  const crud = useCrudDialogs<Department>();
  const [filter, setFilter] = useState("");
  const [state, setState] = useState<"all" | "active" | "inactive">("all");

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (d) =>
          d.departmentName.toLowerCase().includes(filter.toLowerCase()) &&
          (state === "all" || (state === "active") === d.isActive),
      ),
    [data, filter, state],
  );

  const columns: Column<Department>[] = [
    { key: "id", header: "ID", sortValue: (d) => d.departmentId, className: "w-16", cell: (d) => <span className="font-mono text-xs text-muted">#{d.departmentId}</span> },
    {
      key: "name",
      header: "Department",
      sortValue: (d) => d.departmentName.toLowerCase(),
      cell: (d) => (
        <Link href={`/departments/${d.departmentId}`} className="flex items-center gap-3 font-medium text-fg hover:text-primary">
          <DepartmentAvatar id={d.departmentId} name={d.departmentName} size="sm" />
          {d.departmentName}
        </Link>
      ),
    },
    { key: "desc", header: "Description", cell: (d) => <p className="line-clamp-2 max-w-md text-muted">{d.departmentDescription}</p> },
    { key: "projects", header: "Projects", sortValue: (d) => d.projectCount, align: "right", cell: (d) => <span className="tabular-nums">{d.projectCount}</span> },
    { key: "status", header: "Status", sortValue: (d) => (d.isActive ? 1 : 0), cell: (d) => <ActiveBadge active={d.isActive} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (d) => (
        <div className="flex justify-end gap-0.5">
          <RowAction label={`Edit ${d.departmentName}`} onClick={() => crud.openEdit(d)}>
            <Pencil className="h-4 w-4" />
          </RowAction>
          <RowAction label={`Delete ${d.departmentName}`} danger onClick={() => crud.askDelete(d)}>
            <Trash2 className="h-4 w-4" />
          </RowAction>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Departments" }]}
        title="Departments"
        description="Create, edit and delete departments. A department that still has projects cannot be deleted."
        actions={
          <button className="btn btn-primary" onClick={crud.openCreate}>
            <Plus className="h-4 w-4" /> New department
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Filter by name…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter" />
        </div>
        <Segmented
          ariaLabel="Filter by state"
          value={state}
          onChange={setState}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <TableSkeleton />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(d) => d.departmentId}
          mobileCard={(d) => (
            <div className="flex items-start gap-3">
              <DepartmentAvatar id={d.departmentId} name={d.departmentName} />
              <div className="min-w-0 flex-1">
                <Link href={`/departments/${d.departmentId}`} className="font-medium text-fg">
                  {d.departmentName}
                </Link>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{d.departmentDescription}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <ActiveBadge active={d.isActive} /> {d.projectCount} project{d.projectCount === 1 ? "" : "s"}
                </div>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <RowAction label={`Edit ${d.departmentName}`} onClick={() => crud.openEdit(d)}>
                  <Pencil className="h-4 w-4" />
                </RowAction>
                <RowAction label={`Delete ${d.departmentName}`} danger onClick={() => crud.askDelete(d)}>
                  <Trash2 className="h-4 w-4" />
                </RowAction>
              </div>
            </div>
          )}
          initialSort={{ key: "id", dir: "asc" }}
          dimmed={loading}
          empty={
            <EmptyState
              title="No departments"
              description="Create your first department to get started."
              action={
                <button className="btn btn-primary" onClick={crud.openCreate}>
                  <Plus className="h-4 w-4" /> New department
                </button>
              }
            />
          }
        />
      )}

      <Modal
        open={crud.formOpen}
        onOpenChange={crud.setFormOpen}
        title={crud.editing ? "Edit department" : "New department"}
        description={crud.editing ? `Update “${crud.editing.departmentName}”.` : "Add a department to organise projects."}
      >
        <DepartmentForm
          key={crud.editing?.departmentId ?? "new"}
          initial={crud.editing}
          onCancel={crud.closeForm}
          onSubmit={async (values) => {
            if (crud.editing) {
              await departmentsApi.update(crud.editing.departmentId, values);
              toast.success(`Department “${values.departmentName}” updated.`);
            } else {
              await departmentsApi.create(values);
              toast.success(`Department “${values.departmentName}” created.`);
            }
            crud.closeForm();
            reload();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!crud.deleting}
        onOpenChange={(v) => !v && crud.cancelDelete()}
        title="Delete department?"
        message={
          <>
            <b className="text-fg">{crud.deleting?.departmentName}</b> will be permanently deleted. Departments that still have projects cannot be deleted.
          </>
        }
        loading={crud.deleteLoading}
        onConfirm={() =>
          crud.confirmDelete(
            (d) => departmentsApi.remove(d.departmentId),
            (d) => `Department “${d.departmentName}” deleted.`,
            reload,
          )
        }
      />
    </div>
  );
}
