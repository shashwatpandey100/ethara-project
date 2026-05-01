import { apiClient } from "./client";

export interface DashboardStats {
  myTaskStats: {
    total: number;
    todo: number;
    inProgress: number;
    inReview: number;
    done: number;
    overdue: number;
  };
  projectCount: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    meta: Record<string, unknown> | null;
    createdAt: string;
    projectId: string;
    userName: string | null;
  }>;
  overdueTasks: Array<{
    id: string;
    title: string;
    priority: string;
    dueDate: string;
    projectId: string;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    projectId: string;
  }>;
}

export const getDashboardStats = () =>
  apiClient.request<{ success: boolean; data: DashboardStats }>("/api/dashboard");

export const getProjectDigest = (projectId: string) =>
  apiClient.request<{ success: boolean; data: { digest: string } }>(
    `/api/dashboard/projects/${projectId}/digest`
  );
