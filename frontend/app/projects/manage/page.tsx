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
import ProjectForm from "@/components/forms/ProjectForm";
import DepartmentAvatar from "@/components/DepartmentAvatar";
import { ActiveBadge, ProjectStatusBadge } from "@/components/Badges";
import { departmentsApi, projectsApi } from "@/lib/api";
import { PROJECT_STATUS } from "@/lib/constants";
import type { Project } from "@/lib/types";
import { useCrudDialogs } from "@/lib/useCrudDialogs";
import { useFetch } from "@/lib/useFetch";
import { formatDate } from "@/lib/utils";

export default function ProjectManagePage() {
  const { data, loading, error, reload } = useFetch(() => projectsApi.list(true), []);
  const departments = useFetch(() => departmentsApi.list(true), []);
  const crud = useCrudDialogs<Project>();
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (p) =>
          p.projectName.toLowerCase().includes(filter.toLowerCase()) &&
          (status === "" || p.status === Number(status)) &&
          (departmentId === "" || p.departmentId === Number(departmentId)),
      ),
    [data, filter, status, departmentId],
  );

  const columns: Column<Project>[] = [
    { key: "id", header: "ID", sortValue: (p) => p.projectId, className: "w-16", cell: (p) => <span className="font-mono text-xs text-muted">#{p.projectId}</span> },
    {
      key: "name",
      header: "Project",
      sortValue: (p) => p.projectName.toLowerCase(),
      cell: (p) => (
        <Link href={`/projects/${p.projectId}`} className="font-medium text-fg hover:text-primary">
          {p.projectName}
        </Link>
      ),
    },
    {
      key: "dept",
      header: "Department",
      sortValue: (p) => p.departmentName.toLowerCase(),
      cell: (p) => (
        <span className="flex items-center gap-2 whitespace-nowrap text-fg-2">
          <DepartmentAvatar id={p.departmentId} name={p.departmentName} size="sm" />
          {p.departmentName}
        </span>
      ),
    },
    { key: "status", header: "Status", sortValue: (p) => p.status, cell: (p) => <ProjectStatusBadge status={p.status} /> },
    {
      key: "timeline",
      header: "Timeline",
      sortValue: (p) => p.startDate,
      cell: (p) => (
        <span className="whitespace-nowrap text-fg-2">
          {formatDate(p.startDate)} <span className="text-muted">→</span> {p.endDate ? formatDate(p.endDate) : <span className="text-muted">Ongoing</span>}
        </span>
      ),
    },
    { key: "tasks", header: "Tasks", sortValue: (p) => p.taskCount, align: "right", cell: (p) => <span className="tabular-nums">{p.taskCount}</span> },
    { key: "active", header: "State", sortValue: (p) => (p.isActive ? 1 : 0), cell: (p) => <ActiveBadge active={p.isActive} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (p) => (
        <div className="flex justify-end gap-0.5">
          <RowAction label={`Edit ${p.projectName}`} onClick={() => crud.openEdit(p)}>
            <Pencil className="h-4 w-4" />
          </RowAction>
          <RowAction label={`Delete ${p.projectName}`} danger onClick={() => crud.askDelete(p)}>
            <Trash2 className="h-4 w-4" />
          </RowAction>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Projects" }]}
        title="Projects"
        description="Create, edit and delete projects. A project that still has tasks cannot be deleted."
        actions={
          <button className="btn btn-primary" onClick={crud.openCreate}>
            <Plus className="h-4 w-4" /> New project
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Filter by name…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter" />
        </div>
        <select className="input sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {PROJECT_STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select className="input sm:w-52" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} aria-label="Filter by department">
          <option value="">All departments</option>
          {departments.data?.map((d) => (
            <option key={d.departmentId} value={d.departmentId}>
              {d.departmentName}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <TableSkeleton cols={7} />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(p) => p.projectId}
          mobileCard={(p) => (
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <Link href={`/projects/${p.projectId}`} className="font-medium text-fg">
                  {p.projectName}
                </Link>
                <p className="mt-0.5 text-xs text-muted">
                  #{p.projectId} · {p.departmentName} · {p.taskCount} task{p.taskCount === 1 ? "" : "s"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <ProjectStatusBadge status={p.status} />
                  <ActiveBadge active={p.isActive} />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {formatDate(p.startDate)} → {p.endDate ? formatDate(p.endDate) : "Ongoing"}
                </p>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <RowAction label={`Edit ${p.projectName}`} onClick={() => crud.openEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </RowAction>
                <RowAction label={`Delete ${p.projectName}`} danger onClick={() => crud.askDelete(p)}>
                  <Trash2 className="h-4 w-4" />
                </RowAction>
              </div>
            </div>
          )}
          initialSort={{ key: "id", dir: "asc" }}
          minWidth={960}
          dimmed={loading}
          empty={<EmptyState title="No projects" description="No projects match these filters." />}
        />
      )}

      <Modal
        open={crud.formOpen}
        onOpenChange={crud.setFormOpen}
        title={crud.editing ? "Edit project" : "New project"}
        description={crud.editing ? `Update “${crud.editing.projectName}”.` : "Projects belong to a department and group related tasks."}
        size="lg"
      >
        <ProjectForm
          key={crud.editing?.projectId ?? "new"}
          initial={crud.editing}
          departments={departments.data ?? []}
          onCancel={crud.closeForm}
          onSubmit={async (values) => {
            if (crud.editing) {
              await projectsApi.update(crud.editing.projectId, values);
              toast.success(`Project “${values.projectName}” updated.`);
            } else {
              await projectsApi.create(values);
              toast.success(`Project “${values.projectName}” created.`);
            }
            crud.closeForm();
            reload();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!crud.deleting}
        onOpenChange={(v) => !v && crud.cancelDelete()}
        title="Delete project?"
        message={
          <>
            <b className="text-fg">{crud.deleting?.projectName}</b> will be permanently deleted. Projects that still have tasks cannot be deleted.
          </>
        }
        loading={crud.deleteLoading}
        onConfirm={() =>
          crud.confirmDelete(
            (p) => projectsApi.remove(p.projectId),
            (p) => `Project “${p.projectName}” deleted.`,
            reload,
          )
        }
      />
    </div>
  );
}
