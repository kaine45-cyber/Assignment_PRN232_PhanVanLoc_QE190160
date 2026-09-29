"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { RowAction, type Column } from "@/components/ui/DataTable";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/Feedback";
import Segmented from "@/components/ui/Segmented";
import TaskForm from "@/components/forms/TaskForm";
import { TaskMobileCard, taskColumns } from "@/components/TaskColumns";
import { projectsApi, tagsApi, tasksApi } from "@/lib/api";
import { TASK_STATUS } from "@/lib/constants";
import type { Task } from "@/lib/types";
import { useCrudDialogs } from "@/lib/useCrudDialogs";
import { useFetch } from "@/lib/useFetch";
import { cn } from "@/lib/utils";

function TaskManageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { data, loading, error, reload } = useFetch(() => tasksApi.list(), []);
  const projects = useFetch(() => projectsApi.list(true), []);
  const tags = useFetch(() => tagsApi.list(), []);
  const crud = useCrudDialogs<Task>();
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<number | null>(null);
  const [defaultProjectId, setDefaultProjectId] = useState<number | undefined>();

  // Deep link: /tasks/manage?new=1&projectId=3 opens the create modal (used by "New task" buttons).
  useEffect(() => {
    if (params.get("new") === "1") {
      const pid = Number(params.get("projectId"));
      setDefaultProjectId(Number.isFinite(pid) && pid > 0 ? pid : undefined);
      crud.openCreate();
      router.replace(pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const rows = useMemo(
    () => (data ?? []).filter((t) => t.title.toLowerCase().includes(filter.toLowerCase()) && (status === null || t.status === status)),
    [data, filter, status],
  );
  const countFor = (s: number | null) => (data ?? []).filter((t) => s === null || t.status === s).length;

  const actionsFor = (t: Task) => (
    <>
      <RowAction label={`Edit ${t.title}`} onClick={() => (setDefaultProjectId(undefined), crud.openEdit(t))}>
        <Pencil className="h-4 w-4" />
      </RowAction>
      <RowAction label={`Delete ${t.title}`} danger onClick={() => crud.askDelete(t)}>
        <Trash2 className="h-4 w-4" />
      </RowAction>
    </>
  );

  const columns: Column<Task>[] = [
    ...taskColumns({ showProject: true, showId: true }),
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (t) => <div className="flex justify-end gap-0.5">{actionsFor(t)}</div>,
    },
  ];
  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Tasks" }]}
        title="Tasks"
        description="Create, edit and delete tasks. Deleting a task hides it (soft delete) — it is never removed from the database."
        actions={
          <button className="btn btn-primary" onClick={() => (setDefaultProjectId(undefined), crud.openCreate())}>
            <Plus className="h-4 w-4" /> New task
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Segmented
          ariaLabel="Filter by status"
          value={status}
          onChange={setStatus}
          options={[
            { value: null, label: "All", count: data ? countFor(null) : undefined },
            ...TASK_STATUS.map((s) => ({
              value: s.value as number | null,
              label: (
                <>
                  <span className={cn("h-2 w-2 rounded-full", s.dot)} aria-hidden />
                  {s.label}
                </>
              ),
              count: data ? countFor(s.value) : undefined,
            })),
          ]}
        />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Filter by title…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by title" />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <TableSkeleton cols={7} />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(t) => t.taskId}
          mobileCard={(t) => <TaskMobileCard task={t} actions={actionsFor(t)} />}
          initialSort={{ key: "id", dir: "asc" }}
          minWidth={980}
          dimmed={loading}
          empty={<EmptyState title="No tasks" description="No tasks match these filters." />}
        />
      )}

      <Modal
        open={crud.formOpen}
        onOpenChange={crud.setFormOpen}
        title={crud.editing ? "Edit task" : "New task"}
        description={crud.editing ? `Update task #${crud.editing.taskId}.` : "Tasks belong to a project and can have several tags."}
        size="lg"
      >
        <TaskForm
          key={crud.editing?.taskId ?? `new-${defaultProjectId ?? ""}`}
          initial={crud.editing}
          projects={projects.data ?? []}
          tags={tags.data ?? []}
          defaultProjectId={defaultProjectId}
          onCancel={crud.closeForm}
          onSubmit={async (values) => {
            if (crud.editing) {
              await tasksApi.update(crud.editing.taskId, values);
              toast.success(`Task “${values.title}” updated.`);
            } else {
              await tasksApi.create(values);
              toast.success(`Task “${values.title}” created.`);
            }
            crud.closeForm();
            reload();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!crud.deleting}
        onOpenChange={(v) => !v && crud.cancelDelete()}
        title="Delete task?"
        message={
          <>
            <b className="text-fg">{crud.deleting?.title}</b> will be hidden from all lists. This is a soft delete — the record stays in the database.
          </>
        }
        loading={crud.deleteLoading}
        onConfirm={() =>
          crud.confirmDelete(
            (t) => tasksApi.remove(t.taskId),
            (t) => `Task “${t.title}” deleted.`,
            reload,
          )
        }
      />
    </div>
  );
}

export default function TaskManagePage() {
  return (
    <Suspense fallback={<TableSkeleton cols={7} />}>
      <TaskManageContent />
    </Suspense>
  );
}
