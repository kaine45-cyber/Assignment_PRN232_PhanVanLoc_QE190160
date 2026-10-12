"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Lock, Pencil, Search, Trash2 } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import PageHeader from "@/components/ui/PageHeader";
import Modal, { ModalFooter } from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable, { RowAction, type Column } from "@/components/ui/DataTable";
import { EmptyState, ErrorState, Spinner, TableSkeleton } from "@/components/ui/Feedback";
import FormField from "@/components/ui/FormField";
import Segmented from "@/components/ui/Segmented";
import { accountsApi } from "@/lib/api";
import { handleFormError } from "@/lib/forms";
import type { Account } from "@/lib/types";
import { useCrudDialogs } from "@/lib/useCrudDialogs";
import { useFetch } from "@/lib/useFetch";
import { cn, formatDateTime, initials } from "@/lib/utils";

function RoleBadge({ role }: { role: number }) {
  const admin = role === 1;
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", admin ? "bg-violet-500/10 text-violet-700 ring-violet-500/25 dark:text-violet-300" : "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:text-sky-300")}>
      {admin ? "Admin" : "Staff"}
    </span>
  );
}

const schema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(100, "Max 100 characters."),
  role: z.string(),
});
type Values = z.infer<typeof schema>;

function AccountForm({ account, isSelf, onSubmit, onCancel }: { account: Account; isSelf: boolean; onSubmit: (v: { fullName: string; role: number }) => Promise<void>; onCancel: () => void }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: account.fullName, role: String(account.role) },
  });
  const submit = async (v: Values) => {
    try {
      await onSubmit({ fullName: v.fullName, role: Number(v.role) });
    } catch (err) {
      handleFormError(err, setError, ["fullName", "role"]);
    }
  };
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <FormField label="Email" htmlFor="email">
        <input id="email" className="input" value={account.email} disabled readOnly />
      </FormField>
      <FormField label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
        <input id="fullName" autoFocus className={cn("input", errors.fullName && "input-error")} {...register("fullName")} />
      </FormField>
      <FormField label="Role" htmlFor="role" required error={errors.role?.message} hint={isSelf ? "You cannot change your own role." : "Admins can manage accounts."}>
        <select id="role" className="input" disabled={isSelf} {...register("role")}>
          <option value="0">Staff</option>
          <option value="1">Admin</option>
        </select>
      </FormField>
      <ModalFooter>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} Save changes
        </button>
      </ModalFooter>
    </form>
  );
}

function AccountsContent() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => accountsApi.list(), []);
  const crud = useCrudDialogs<Account>();
  const [filter, setFilter] = useState("");
  const [role, setRole] = useState<number | null>(null);

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (a) => (a.fullName + " " + a.email).toLowerCase().includes(filter.toLowerCase()) && (role === null || a.role === role),
      ),
    [data, filter, role],
  );
  const isSelf = (a: Account) => a.accountId === user?.accountId;

  const actions = (a: Account) =>
    isSelf(a) ? (
      <>
        <RowAction label={`Edit ${a.fullName}`} onClick={() => crud.openEdit(a)}>
          <Pencil className="h-4 w-4" />
        </RowAction>
        <span className="btn btn-ghost btn-sm btn-icon cursor-default opacity-50" title="You cannot delete your own account">
          <Lock className="h-4 w-4" />
        </span>
      </>
    ) : (
      <>
        <RowAction label={`Edit ${a.fullName}`} onClick={() => crud.openEdit(a)}>
          <Pencil className="h-4 w-4" />
        </RowAction>
        <RowAction label={`Delete ${a.fullName}`} danger onClick={() => crud.askDelete(a)}>
          <Trash2 className="h-4 w-4" />
        </RowAction>
      </>
    );

  const columns: Column<Account>[] = [
    { key: "id", header: "ID", sortValue: (a) => a.accountId, className: "w-16", cell: (a) => <span className="font-mono text-xs text-muted">#{a.accountId}</span> },
    {
      key: "name",
      header: "Account",
      sortValue: (a) => a.fullName.toLowerCase(),
      cell: (a) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{initials(a.fullName)}</span>
          <div className="min-w-0">
            <p className="font-medium text-fg">
              {a.fullName} {isSelf(a) && <span className="ml-1 text-xs font-normal text-muted">(you)</span>}
            </p>
            <p className="truncate text-xs text-muted">{a.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Role", sortValue: (a) => a.role, cell: (a) => <RoleBadge role={a.role} /> },
    { key: "tasks", header: "Tasks created", sortValue: (a) => a.createdTaskCount, align: "right", cell: (a) => <span className="tabular-nums">{a.createdTaskCount}</span> },
    { key: "created", header: "Created", sortValue: (a) => a.createdDate, cell: (a) => <span className="whitespace-nowrap text-fg-2">{formatDateTime(a.createdDate)}</span> },
    { key: "actions", header: "", align: "right", cell: (a) => <div className="flex justify-end gap-0.5">{actions(a)}</div> },
  ];

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Accounts" }]}
        title="Accounts"
        description="Admin only. Change a user's name or role, or delete accounts. Accounts that have created tasks cannot be deleted."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Filter by name or email…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter accounts" />
        </div>
        <Segmented
          ariaLabel="Filter by role"
          value={role}
          onChange={setRole}
          options={[
            { value: null, label: "All", count: data?.length },
            { value: 1, label: "Admin", count: data?.filter((a) => a.role === 1).length },
            { value: 0, label: "Staff", count: data?.filter((a) => a.role === 0).length },
          ]}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <TableSkeleton cols={5} />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(a) => a.accountId}
          initialSort={{ key: "id", dir: "asc" }}
          minWidth={760}
          dimmed={loading}
          empty={<EmptyState title="No accounts match these filters" />}
          mobileCard={(a) => (
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-fg">
                  {a.fullName} {isSelf(a) && <span className="text-xs font-normal text-muted">(you)</span>}
                </p>
                <p className="truncate text-xs text-muted">{a.email}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <RoleBadge role={a.role} /> {a.createdTaskCount} task(s) created
                </div>
              </div>
              <div className="flex shrink-0 gap-0.5">{actions(a)}</div>
            </div>
          )}
        />
      )}

      <Modal open={crud.formOpen} onOpenChange={crud.setFormOpen} title="Edit account" description={crud.editing ? `Update ${crud.editing.email}.` : undefined}>
        {crud.editing && (
          <AccountForm
            key={crud.editing.accountId}
            account={crud.editing}
            isSelf={isSelf(crud.editing)}
            onCancel={crud.closeForm}
            onSubmit={async (values) => {
              await accountsApi.update(crud.editing!.accountId, values);
              toast.success(`Account “${values.fullName}” updated.`);
              crud.closeForm();
              reload();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!crud.deleting}
        onOpenChange={(v) => !v && crud.cancelDelete()}
        title="Delete account?"
        message={
          <>
            <b className="text-fg">{crud.deleting?.fullName}</b> ({crud.deleting?.email}) will be permanently deleted. Accounts that have created tasks cannot be deleted.
          </>
        }
        loading={crud.deleteLoading}
        onConfirm={() =>
          crud.confirmDelete(
            (a) => accountsApi.remove(a.accountId),
            (a) => `Account “${a.fullName}” deleted.`,
            reload,
          )
        }
      />
    </div>
  );
}

export default function AccountsPage() {
  return (
    <RequireAuth role="Admin">
      <AccountsContent />
    </RequireAuth>
  );
}
