import { apiClient } from '@/shared/api/axios.instance';
import type { Invoice, CreateInvoicePayload, UpdateInvoicePayload } from './types';
import type { PaginationMeta } from '@/components/ui/pagination';

const BASE_URL = '/invoices';

export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginationMeta;
}

export const invoicesApi = {
  getInvoices: async (params?: Record<string, any>) => {
    const response = await apiClient.get<PaginatedResponse<Invoice>>(BASE_URL, {
      params: { paginate: true, page: 1, per_page: 50, ...params },
    });
    return response.data;
  },

  getInvoice: async (id: number) => {
    if (!id) return null;
    const response = await apiClient.get<any>(`${BASE_URL}/${id}`);
    return response.data?.data ?? response.data ?? null;
  },

  createInvoice: async (payload: CreateInvoicePayload) => {
    const response = await apiClient.post<{ data: Invoice; message?: string }>(
      BASE_URL,
      payload,
      {
        headers: { 'x-success-message': 'تم إضافة الفاتورة بنجاح' },
      }
    );
    return response.data?.data ?? response.data;
  },

  updateInvoice: async ({
    id,
    payload,
  }: {
    id: number;
    payload: UpdateInvoicePayload;
  }) => {
    const response = await apiClient.patch<{ data: Invoice; message?: string }>(
      `${BASE_URL}/${id}`,
      payload,
      {
        headers: { 'x-success-message': 'تم تحديث الفاتورة بنجاح' },
      }
    );
    return response.data?.data ?? response.data;
  },

  deleteInvoice: async (id: number) => {
    const response = await apiClient.delete<{ message?: string }>(`${BASE_URL}/${id}`, {
      headers: { 'x-success-message': 'تم حذف الفاتورة بنجاح' },
    });
    return response.data;
  },

  bulkUpdateIsPosted: async (payload: { ids: number[]; is_posted: boolean }) => {
    const response = await apiClient.patch<{ message?: string }>(
      `${BASE_URL}/bulk-update-is-posted`,
      payload,
      {
        headers: { 'x-success-message': 'تم ترحيل الفواتير بنجاح' },
      }
    );
    return response.data;
  },
};
