import { apiClient } from '@/shared/api/axios.instance';
import type {
  CreateProjectTeamPayload,
  ProjectTeamMember,
  UpdateProjectTeamPayload,
} from './project-team.types';

export const projectTeamApi = {
  /** GET /api/project-teams — returns all members (optionally filtered by project_id) */
  getAll: async (params?: Record<string, any>): Promise<ProjectTeamMember[]> => {
    const response = await apiClient.get('/project-teams', { params });
    return response.data?.data?.data ?? response.data?.data ?? response.data ?? [];
  },

  /** GET /api/project-teams/:id */
  getById: async (id: number): Promise<ProjectTeamMember> => {
    const response = await apiClient.get(`/project-teams/${id}`);
    return response.data?.data ?? response.data;
  },

  /** POST /api/project-teams */
  create: async (payload: CreateProjectTeamPayload): Promise<ProjectTeamMember> => {
    const response = await apiClient.post('/project-teams', payload);
    return response.data?.data ?? response.data;
  },

  /** PATCH /api/project-teams/:id */
  update: async (id: number, payload: UpdateProjectTeamPayload): Promise<ProjectTeamMember> => {
    const response = await apiClient.patch(`/project-teams/${id}`, payload);
    return response.data?.data ?? response.data;
  },

  /** DELETE /api/project-teams/:id */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/project-teams/${id}`);
  },
};
