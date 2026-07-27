import { apiClient } from '@/shared/api/axios.instance';
import type {
  CreateStageTimelinePayload,
  StageTimeline,
  UpdateStageTimelinePayload,
} from './stage-timelines.types';

export const stageTimelinesApi = {
  /** GET /api/stage-timelines */
  getAll: async (params?: Record<string, any>): Promise<StageTimeline[]> => {
    const response = await apiClient.get('/stage-timelines', { params });
    return response.data?.data?.data ?? response.data?.data ?? response.data ?? [];
  },

  /** GET /api/stage-timelines/:id */
  getById: async (id: number): Promise<StageTimeline> => {
    const response = await apiClient.get(`/stage-timelines/${id}`);
    return response.data?.data ?? response.data;
  },

  /** POST /api/stage-timelines */
  create: async (payload: CreateStageTimelinePayload): Promise<StageTimeline> => {
    const response = await apiClient.post('/stage-timelines', payload);
    return response.data?.data ?? response.data;
  },

  /** PATCH /api/stage-timelines/:id */
  update: async (id: number, payload: UpdateStageTimelinePayload): Promise<StageTimeline> => {
    const response = await apiClient.patch(`/stage-timelines/${id}`, payload);
    return response.data?.data ?? response.data;
  },

  /** DELETE /api/stage-timelines/:id */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/stage-timelines/${id}`);
  },
};
