import { apiClient } from '@/shared/api/axios.instance';
import type { CreateProjectPayload, Project, UpdateProjectPayload } from './types';

export const projectsApi = {
  getProjects: () => apiClient.get<Project[]>('/projects').then(({ data }: any) => data?.data ?? data),
  getDepartments: () => apiClient.get<{ id: number; name: string }[]>('/departments').then(({ data }: any) => data?.data ?? data),
  getProjectById: (id: number) => apiClient.get<Project>(`/projects/${id}`).then(({ data }: any) => data?.data ?? data),
  createProject: (payload: CreateProjectPayload) => apiClient.post<Project>('/projects', payload).then(({ data }: any) => data?.data ?? data),
  updateProject: (id: number, payload: UpdateProjectPayload) => apiClient.patch<Project>(`/projects/${id}`, payload).then(({ data }: any) => data?.data ?? data),
  deleteProject: (id: number) => apiClient.delete(`/projects/${id}`).then(({ data }: any) => data?.data ?? data),
};
