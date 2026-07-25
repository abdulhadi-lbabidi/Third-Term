import { apiClient } from '@/shared/api/axios.instance';
import type { CreateProjectPayload, Project, UpdateProjectPayload } from './types';

export const projectsApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects');
    return response.data;
  },
  createProject: async (payload: CreateProjectPayload): Promise<Project> => {
    const response = await apiClient.post('/projects', payload);
    return response.data;
  },
  updateProject: async (id: number, payload: UpdateProjectPayload): Promise<Project> => {
    const response = await apiClient.patch(`/projects/${id}`, payload);
    return response.data;
  },
  deleteProject: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
};
