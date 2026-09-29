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

export interface Project {
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

export interface Task {
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
