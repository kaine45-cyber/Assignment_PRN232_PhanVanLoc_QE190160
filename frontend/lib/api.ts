import type {
  Department,
  DepartmentDetail,
  DepartmentRequest,
  Project,
  ProjectDetail,
  ProjectRequest,
  ProjectSearchParams,
  Tag,
  TagRequest,
  Task,
  TaskRequest,
  TaskSearchParams,
} from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/+$/, "");

/** Error thrown for non-2xx responses. `fieldErrors` keys are camelCase to match form field names. */
export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const toCamel = (key: string) => key.charAt(0).toLowerCase() + key.slice(1);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. It may be waking up — please try again in a moment.");
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const fieldErrors: Record<string, string> = {};
    if (body?.errors && typeof body.errors === "object") {
      for (const [key, value] of Object.entries(body.errors)) {
        const messages = Array.isArray(value) ? value : [String(value)];
        // "$.startDate" style keys come from JSON binding errors
        fieldErrors[toCamel(key.replace(/^\$\./, ""))] = messages[0] as string;
      }
    }
    const message =
      body?.message ??
      (Object.keys(fieldErrors).length ? Object.values(fieldErrors)[0] : body?.title) ??
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message, fieldErrors);
  }

  return body as T;
}

function qs(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      search.set(key, String(value).trim());
    }
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

const json = (data: unknown) => JSON.stringify(data);

export const departmentsApi = {
  list: (includeInactive = false) => request<Department[]>(`/departments${includeInactive ? "?includeInactive=true" : ""}`),
  get: (id: number | string) => request<DepartmentDetail>(`/departments/${id}`),
  search: (name: string) => request<Department[]>(`/departments/search${qs({ name })}`),
  create: (data: DepartmentRequest) => request<Department>("/departments", { method: "POST", body: json(data) }),
  update: (id: number, data: DepartmentRequest) => request<Department>(`/departments/${id}`, { method: "PUT", body: json(data) }),
  remove: (id: number) => request<void>(`/departments/${id}`, { method: "DELETE" }),
};

export const projectsApi = {
  list: (includeInactive = false) => request<Project[]>(`/projects${includeInactive ? "?includeInactive=true" : ""}`),
  get: (id: number | string) => request<ProjectDetail>(`/projects/${id}`),
  byDepartment: (departmentId: number | string) => request<Project[]>(`/projects/department/${departmentId}`),
  search: (params: ProjectSearchParams) => request<Project[]>(`/projects/search${qs(params)}`),
  create: (data: ProjectRequest) => request<Project>("/projects", { method: "POST", body: json(data) }),
  update: (id: number, data: ProjectRequest) => request<Project>(`/projects/${id}`, { method: "PUT", body: json(data) }),
  remove: (id: number) => request<void>(`/projects/${id}`, { method: "DELETE" }),
};

export const tasksApi = {
  list: () => request<Task[]>("/tasks"),
  get: (id: number | string) => request<Task>(`/tasks/${id}`),
  byProject: (projectId: number | string) => request<Task[]>(`/tasks/project/${projectId}`),
  search: (params: TaskSearchParams) => request<Task[]>(`/tasks/search${qs(params)}`),
  create: (data: TaskRequest) => request<Task>("/tasks", { method: "POST", body: json(data) }),
  update: (id: number, data: TaskRequest) => request<Task>(`/tasks/${id}`, { method: "PUT", body: json(data) }),
  remove: (id: number) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
};

export const tagsApi = {
  list: () => request<Tag[]>("/tags"),
  create: (data: TagRequest) => request<Tag>("/tags", { method: "POST", body: json(data) }),
  update: (id: number, data: TagRequest) => request<Tag>(`/tags/${id}`, { method: "PUT", body: json(data) }),
  remove: (id: number) => request<void>(`/tags/${id}`, { method: "DELETE" }),
};

/** Pings the backend health endpoint (outside /api). Used by the sidebar status indicator. */
export async function checkHealth(timeoutMs = 60000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store", signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export const API_URL = API_BASE;

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
