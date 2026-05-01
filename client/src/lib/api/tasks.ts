import { apiClient } from "./client";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "in_review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeImage: string | null;
  createdBy: string;
  dueDate: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  content: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
  createdAt: string;
}

export const getTasks = (projectId: string, params?: { status?: string; assignee?: string }) => {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.assignee) qs.set("assignee", params.assignee);
  const q = qs.toString();
  return apiClient.request<{ success: boolean; data: Task[] }>(
    `/api/projects/${projectId}/tasks${q ? `?${q}` : ""}`
  );
};

export const getTask = (projectId: string, taskId: string) =>
  apiClient.request<{ success: boolean; data: Task & { comments: TaskComment[] } }>(
    `/api/projects/${projectId}/tasks/${taskId}`
  );

export const createTask = (
  projectId: string,
  data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    dueDate?: string;
  }
) =>
  apiClient.request<{ success: boolean; data: Task }>(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    body: data,
  });

export const updateTask = (
  projectId: string,
  taskId: string,
  data: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    assigneeId: string | null;
    dueDate: string | null;
    order: number;
  }>
) =>
  apiClient.request<{ success: boolean; data: Task }>(
    `/api/projects/${projectId}/tasks/${taskId}`,
    { method: "PATCH", body: data }
  );

export const deleteTask = (projectId: string, taskId: string) =>
  apiClient.request<{ success: boolean }>(
    `/api/projects/${projectId}/tasks/${taskId}`,
    { method: "DELETE" }
  );

export const bulkDeleteTasks = (projectId: string, taskIds: string[]) =>
  apiClient.request<{ success: boolean; data: { succeeded: number; failed: number } }>(
    `/api/projects/${projectId}/tasks/bulk-delete`,
    { method: "POST", body: { taskIds } }
  );

export const addComment = (projectId: string, taskId: string, content: string) =>
  apiClient.request<{ success: boolean; data: TaskComment }>(
    `/api/projects/${projectId}/tasks/${taskId}/comments`,
    { method: "POST", body: { content } }
  );
