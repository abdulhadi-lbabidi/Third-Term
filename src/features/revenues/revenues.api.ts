import { apiClient } from '@/shared/api/axios.instance';
import type { CreateRevenuePayload, Revenue, UpdateRevenuePayload } from './types';

export const revenuesApi = {
  getRevenues: async (): Promise<Revenue[]> => {
    const response = await apiClient.get('/revenues');
    const payload = response.data as { data?: Revenue[] } | Revenue[];
    return Array.isArray(payload) ? payload : payload.data ?? [];
  },

  getRevenue: async (id: number): Promise<Revenue> => {
    const response = await apiClient.get(`/revenues/${id}`);
    return response.data;
  },

  createRevenue: async (payload: CreateRevenuePayload): Promise<Revenue> => {
    const response = await apiClient.post('/revenues', payload, {
      // Custom success message for interceptor if applicable
      headers: { 'x-success-message': 'تم إضافة الإيراد بنجاح' }
    });
    return response.data;
  },

  updateRevenue: async (id: number, payload: UpdateRevenuePayload): Promise<Revenue> => {
    const response = await apiClient.patch(`/revenues/${id}`, payload, {
      headers: { 'x-success-message': 'تم تعديل الإيراد بنجاح' }
    });
    return response.data;
  },

  deleteRevenue: async (id: number): Promise<void> => {
    await apiClient.delete(`/revenues/${id}`, {
      headers: { 'x-success-message': 'تم حذف الإيراد بنجاح' }
    });
  },
};
