import { apiClient } from '@/shared/api/axios.instance';
import type { Invoice, CreateInvoicePayload, UpdateInvoicePayload } from './types';

const BASE_URL = '/invoices';

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const invoicesApi = {
  getInvoices: async (params?: Record<string, any>) => {
    const response = await apiClient.get<PaginatedResponse<Invoice>>(BASE_URL, {
      params,
    });
    return response.data;
  },

  getInvoice: async (id: number) => {
    const response = await apiClient.get<{ data: Invoice }>(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  createInvoice: async (payload: CreateInvoicePayload) => {
    const response = await apiClient.post<{ data: Invoice; message?: string }>(
      BASE_URL,
      payload,
      {
        headers: { 'x-success-message': 'تم إضافة الفاتورة بنجاح' },
      }
    );
    return response.data;
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
    return response.data;
  },

  deleteInvoice: async (id: number) => {
    const response = await apiClient.delete<{ message?: string }>(`${BASE_URL}/${id}`, {
      headers: { 'x-success-message': 'تم حذف الفاتورة بنجاح' },
    });
    return response.data;
  },
};
