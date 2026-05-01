import { apiClient } from "./client";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  memberCount: number;
}

export interface ProjectMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  userName?: string;
  userImage?: string | null;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
  userRole: string;
}

export interface ProjectsMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export const getProjects = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.search) qs.set("search", params.search);
  if (params?.sort) qs.set("sort", params.sort);
  const q = qs.toString();
  return apiClient.request<{ success: boolean; data: Project[]; meta: ProjectsMeta }>(
    `/api/projects${q ? `?${q}` : ""}`
  );
};

export const getProject = (id: string) =>
  apiClient.request<{ success: boolean; data: ProjectDetail }>(`/api/projects/${id}`);

export const createProject = (data: { name: string; description?: string }) =>
  apiClient.request<{ success: boolean; data: Project }>("/api/projects", {
    method: "POST",
    body: data,
  });

export const updateProject = (id: string, data: { name?: string; description?: string; status?: string }) =>
  apiClient.request<{ success: boolean; data: Project }>(`/api/projects/${id}`, {
    method: "PATCH",
    body: data,
  });

export const deleteProject = (id: string) =>
  apiClient.request<{ success: boolean }>(`/api/projects/${id}`, { method: "DELETE" });

export const generateInviteLink = (id: string) =>
  apiClient.request<{ success: boolean; data: { code: string } }>(`/api/projects/${id}/invite`, {
    method: "POST",
  });

export const getInviteInfo = (code: string) =>
  apiClient.request<{ success: boolean; data: { id: string; name: string; description: string | null; memberCount: number } }>(
    `/api/projects/invite/${code}`
  );

export const joinViaInvite = (code: string) =>
  apiClient.request<{ success: boolean; data: { projectId: string } }>(`/api/projects/join/${code}`, {
    method: "POST",
  });

export const removeMember = (projectId: string, memberId: string) =>
  apiClient.request<{ success: boolean }>(`/api/projects/${projectId}/members/${memberId}`, {
    method: "DELETE",
  });

export const updateMemberRole = (projectId: string, memberId: string, role: "admin" | "member") =>
  apiClient.request<{ success: boolean }>(`/api/projects/${projectId}/members/${memberId}/role`, {
    method: "PATCH",
    body: { role },
  });
