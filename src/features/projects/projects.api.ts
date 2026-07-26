import { apiClient } from '@/shared/api/axios.instance';
import type { CreateProjectPayload, Project, UpdateProjectPayload } from './types';

export const projectsApi = {
  getProjects: () => apiClient.get<Project[]>('/projects').then(res => res.data),
  getDepartments: () => apiClient.get<{ id: number; name: string }[]>('/departments').then(res => res.data),
  getProjectById: (id: number) => apiClient.get<Project>(`/projects/${id}`).then(res => res.data),
  createProject: (payload: CreateProjectPayload) => apiClient.post<Project>('/projects', payload).then(res => res.data),
  updateProject: (id: number, payload: UpdateProjectPayload) => apiClient.patch<Project>(`/projects/${id}`, payload).then(res => res.data),
  deleteProject: (id: number) => apiClient.delete(`/projects/${id}`).then(() => { }),
};
