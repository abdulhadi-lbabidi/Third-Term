import { apiClient } from '@/shared/api/axios.instance';
import type { CreateFundPayload, Fund, UpdateFundPayload } from './types';

export const fundsApi = {
  getFunds: async (): Promise<Fund[]> => {
    const response = await apiClient.get('/funds');
    return response.data;
  },

  createFund: async (payload: CreateFundPayload): Promise<Fund> => {
    const response = await apiClient.post('/funds', payload);
    return response.data;
  },

  updateFund: async (id: number, payload: UpdateFundPayload): Promise<Fund> => {
    const response = await apiClient.patch(`/funds/${id}`, payload);
    return response.data;
  },

  deleteFund: async (id: number): Promise<void> => {
    await apiClient.delete(`/funds/${id}`);
  },
};
