import { ApiClient } from '@/shared/api/api-client';
import type { CreateProjectPayload, Project, UpdateProjectPayload } from './types';

export const projectsApi = {
  getProjects: () => ApiClient.get<Project[]>('/projects').then(res => res.data),
  getDepartments: () => ApiClient.get<{ id: number; name: string }[]>('/departments').then(res => res.data),
  getProjectById: (id: number) => ApiClient.get<Project>(`/projects/${id}`).then(res => res.data),
  createProject: (payload: CreateProjectPayload) => ApiClient.post<Project>('/projects', payload).then(res => res.data),
  updateProject: (id: number, payload: UpdateProjectPayload) => ApiClient.patch<Project>(`/projects/${id}`, payload).then(res => res.data),
  deleteProject: (id: number) => ApiClient.delete(`/projects/${id}`).then(() => {}),
};
