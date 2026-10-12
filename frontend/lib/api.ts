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
  Account,
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  UpdateAccountRequest,
} from "./types";
import { clearSession, getAccessToken, getRefreshToken, loginUrl, saveSession } from "./auth";

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

/** Auth endpoints handle their own 401s (wrong password, invalid refresh token…). */
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

let refreshing: Promise<boolean> | null = null;

/** Exchanges the refresh token for a new token pair. Single-flight: concurrent 401s share one refresh. */
export function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.resolve(false);
  refreshing = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
      if (!res.ok) return false;
      saveSession((await res.json()) as AuthResponse);
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

/** Session is over (expired / revoked): clear it and send the user to /login. */
function endSession(reason: "expired" | "required") {
  const target = loginUrl(reason);
  clearSession(reason === "expired" ? "expired" : null);
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.assign(target);
  }
}

async function request<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const token = getAccessToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        // Every request carries the JWT when the user is logged in (required for POST/PUT/DELETE).
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. It may be waking up — please try again in a moment.");
  }

  // 401 on a protected endpoint → try one silent refresh, then redirect to /login.
  if (res.status === 401 && !AUTH_PATHS.some((p) => path.startsWith(p))) {
    if (token && !retried && (await refreshSession())) return request<T>(path, init, true);
    endSession(token ? "expired" : "required");
    throw new ApiError(401, token ? "Your session has expired. Please log in again." : "Please log in to continue.");
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

export const authApi = {
  register: (data: RegisterRequest) => request<Account>("/auth/register", { method: "POST", body: json(data) }),
  login: (data: LoginRequest) => request<AuthResponse>("/auth/login", { method: "POST", body: json(data) }),
  logout: (refreshToken: string) => request<void>("/auth/logout", { method: "POST", body: json({ refreshToken }) }),
  me: () => request<Account>("/auth/me"),
  updateMe: (fullName: string) => request<Account>("/auth/me", { method: "PUT", body: json({ fullName }) }),
  changePassword: (data: ChangePasswordRequest) => request<void>("/auth/me/password", { method: "PUT", body: json(data) }),
};

/** Admin-only endpoints. */
export const accountsApi = {
  list: () => request<Account[]>("/accounts"),
  get: (id: number) => request<Account>(`/accounts/${id}`),
  update: (id: number, data: UpdateAccountRequest) => request<Account>(`/accounts/${id}`, { method: "PUT", body: json(data) }),
  remove: (id: number) => request<void>(`/accounts/${id}`, { method: "DELETE" }),
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
