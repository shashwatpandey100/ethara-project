import { apiClient } from "./client";

export interface Standup {
  id: string;
  projectId: string;
  createdBy: string;
  title: string;
  audioUrl: string;
  status: "processing" | "completed" | "failed";
  transcript: string | null;
  summary: string | null;
  extractedTasks: { tasks: ExtractedTask[] } | null;
  createdAt: string;
}

export interface ExtractedTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  suggestedAssignee?: string;
}

export const getStandups = (projectId: string) =>
  apiClient.request<{ success: boolean; data: Standup[] }>(
    `/api/projects/${projectId}/standups`
  );

export const getStandup = (projectId: string, standupId: string) =>
  apiClient.request<{ success: boolean; data: Standup }>(
    `/api/projects/${projectId}/standups/${standupId}`
  );

export const createStandup = (projectId: string, data: { title?: string; audioUrl: string }) =>
  apiClient.request<{ success: boolean; data: Standup }>(
    `/api/projects/${projectId}/standups`,
    { method: "POST", body: data }
  );

export const confirmStandupTasks = (
  projectId: string,
  standupId: string,
  selectedTasks: Array<{ title: string; description: string; priority: string }>
) =>
  apiClient.request<{ success: boolean; data: { created: unknown[] } }>(
    `/api/projects/${projectId}/standups/${standupId}/confirm-tasks`,
    { method: "POST", body: { selectedTasks } }
  );

export const deleteStandup = (projectId: string, standupId: string) =>
  apiClient.request<{ success: boolean }>(
    `/api/projects/${projectId}/standups/${standupId}`,
    { method: "DELETE" }
  );
