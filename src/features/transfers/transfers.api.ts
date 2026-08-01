import { apiClient } from '@/shared/api/axios.instance';
import type { CreateTransferPayload, Transfer } from './types';
import type { PaginationMeta } from '@/components/ui/pagination';

export type TransferResponse = {
  data: Transfer[];
  meta?: PaginationMeta;
};

export const transfersApi = {
  getTransfers: async (page = 1, perPage = 50, filters?: Record<string, any>): Promise<TransferResponse> => {
    const response = await apiClient.get('/transactions', {
      params: { paginate: true, page, per_page: perPage, ...filters },
    });
    if (Array.isArray(response.data)) {
      return { data: response.data };
    }
    return {
      data: response.data?.data ?? [],
      meta: response.data?.meta,
    };
  },

  createTransfer: async (payload: CreateTransferPayload): Promise<Transfer> => {
    const response = await apiClient.post('/transactions', payload, {
      headers: { 'x-success-message': 'تم إضافة التحويل بنجاح' },
    });
    return response.data?.data ?? response.data;
  },

  deleteTransfer: async (id: number): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`, {
      headers: { 'x-success-message': 'تم حذف التحويل بنجاح' },
    });
  },
};
