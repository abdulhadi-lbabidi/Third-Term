import { apiClient } from '@/shared/api/axios.instance';
import type { CreateRevenuePayload, Revenue, UpdateRevenuePayload } from './types';
import type { PaginationMeta } from '@/components/ui/pagination';

export type RevenueResponse = {
  data: Revenue[];
  meta?: PaginationMeta;
};

export const revenuesApi = {
  getRevenues: async (page = 1, perPage = 50): Promise<RevenueResponse> => {
    const response = await apiClient.get('/revenues', {
      params: { paginate: true, page, per_page: perPage },
    });
    if (Array.isArray(response.data)) {
      return { data: response.data };
    }
    return {
      data: response.data?.data ?? [],
      meta: response.data?.meta,
    };
  },

  getRevenue: async (id: number): Promise<Revenue> => {
    const response = await apiClient.get(`/revenues/${id}`);
    return response.data;
  },

  createRevenue: async (payload: CreateRevenuePayload): Promise<Revenue> => {
    const response = await apiClient.post('/revenues', payload, {
      headers: { 'x-success-message': 'تم إضافة الإيراد بنجاح' },
    });
    return response.data;
  },

  updateRevenue: async (id: number, payload: UpdateRevenuePayload): Promise<Revenue> => {
    const response = await apiClient.patch(`/revenues/${id}`, payload, {
      headers: { 'x-success-message': 'تم تعديل الإيراد بنجاح' },
    });
    return response.data;
  },

  deleteRevenue: async (id: number): Promise<void> => {
    await apiClient.delete(`/revenues/${id}`, {
      headers: { 'x-success-message': 'تم حذف الإيراد بنجاح' },
    });
  },
};
