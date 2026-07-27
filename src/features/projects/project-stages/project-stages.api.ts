import { apiClient } from '@/shared/api/axios.instance';
import type {
  CreateProjectStagePayload,
  ProjectStage,
  UpdateProjectStagePayload,
} from './project-stages.types';

export const projectStagesApi = {
  /** GET /api/project-stages — returns all stages */
  getAll: async (params?: Record<string, any>): Promise<ProjectStage[]> => {
    const response = await apiClient.get('/project-stages', { params });
    // Handle pagination or raw array
    return response.data?.data?.data ?? response.data?.data ?? response.data ?? [];
  },

  /** GET /api/project-stages/:id */
  getById: async (id: number): Promise<ProjectStage> => {
    const response = await apiClient.get(`/project-stages/${id}`);
    return response.data?.data ?? response.data;
  },

  /** POST /api/project-stages */
  create: async (payload: CreateProjectStagePayload): Promise<ProjectStage> => {
    const response = await apiClient.post('/project-stages', payload);
    return response.data?.data ?? response.data;
  },

  /** PATCH /api/project-stages/:id */
  update: async (id: number, payload: UpdateProjectStagePayload): Promise<ProjectStage> => {
    const response = await apiClient.patch(`/project-stages/${id}`, payload);
    return response.data?.data ?? response.data;
  },

  /** DELETE /api/project-stages/:id */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/project-stages/${id}`);
  },
};
