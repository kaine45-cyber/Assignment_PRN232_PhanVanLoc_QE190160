export interface Department {
  departmentId: number;
  departmentName: string;
  departmentDescription: string;
  isActive: boolean;
  projectCount: number;
}

export interface DepartmentDetail extends Department {
  projects: Project[];
}

export interface Project extends Audit {
  projectId: number;
  projectName: string;
  description: string | null;
  startDate: string; // yyyy-MM-dd
  endDate: string | null;
  status: number;
  statusName: string;
  departmentId: number;
  departmentName: string;
  isActive: boolean;
  createdDate: string;
  taskCount: number;
}

export interface ProjectDetail extends Project {
  tasks: Task[];
}

export interface Tag {
  tagId: number;
  tagName: string;
  color: string | null;
  taskCount: number;
}

export interface Task extends Audit {
  taskId: number;
  title: string;
  description: string | null;
  status: number;
  statusName: string;
  priority: number;
  priorityName: string;
  dueDate: string | null;
  projectId: number;
  projectName: string;
  isActive: boolean;
  createdDate: string;
  modifiedDate: string | null;
  tags: Tag[];
}

export interface DepartmentRequest {
  departmentName: string;
  departmentDescription: string;
  isActive: boolean;
}

export interface ProjectRequest {
  projectName: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  status: number;
  departmentId: number;
  isActive: boolean;
}

export interface TaskRequest {
  title: string;
  description: string | null;
  status: number;
  priority: number;
  dueDate: string | null;
  projectId: number;
  tagIds: number[];
}

export interface TagRequest {
  tagName: string;
  color: string | null;
}

export interface TaskSearchParams {
  title?: string;
  status?: number | string;
  priority?: number | string;
  projectId?: number | string;
  tagId?: number | string;
}

export interface ProjectSearchParams {
  name?: string;
  status?: number | string;
  departmentId?: number | string;
}

// ---------- Assignment 2: authentication ----------
export type RoleName = "Admin" | "Staff";

export interface Account {
  accountId: number;
  fullName: string;
  email: string;
  role: number; // 0 = Staff, 1 = Admin
  roleName: RoleName;
  createdDate: string;
  createdTaskCount: number;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  expiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: Account;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateAccountRequest {
  fullName: string;
  role: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Audit fields returned on projects and tasks. */
export interface Audit {
  createdById?: number | null;
  createdByName?: string | null;
  updatedById?: number | null;
  updatedByName?: string | null;
}
