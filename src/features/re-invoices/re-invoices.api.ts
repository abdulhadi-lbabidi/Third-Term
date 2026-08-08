import { apiClient } from '@/shared/api/axios.instance';
import type { ReInvoice, ReInvoiceItem, ReInvoicePayload } from './types';

function normalizeReInvoicePayload(payload: ReInvoicePayload | Partial<ReInvoicePayload>) {
  return {
    ...payload,
    ...(payload.reinvoiceable_type
      ? { reinvoiceable_type: payload.reinvoiceable_type.replace(/\\+/g, '\\') }
      : {}),
  };
}

export const reInvoicesApi = {
  getAll: async (params?: Record<string, unknown>): Promise<{ data: ReInvoice[]; meta?: any }> => {
    const response = await apiClient.get('/re-invoices', { params: { paginate: true, per_page: 50, page: 1, ...params } });
    return Array.isArray(response.data) ? { data: response.data } : response.data;
  },
  create: async (payload: ReInvoicePayload): Promise<ReInvoice> => {
    const response = await apiClient.post('/re-invoices', normalizeReInvoicePayload(payload));
    return response.data?.data ?? response.data;
  },
  update: async (id: number, payload: Partial<ReInvoicePayload>): Promise<ReInvoice> => {
    const response = await apiClient.patch(`/re-invoices/${id}`, normalizeReInvoicePayload(payload));
    return response.data?.data ?? response.data;
  },
  delete: async (id: number) => apiClient.delete(`/re-invoices/${id}`),
  getItems: async (id: number): Promise<ReInvoiceItem[]> => {
    const response = await apiClient.get('/re-invoice-items', { params: { paginate: true, per_page: 100, page: 1, 'filter[reinvoice_id]': id } });
    return response.data?.data ?? response.data ?? [];
  },
  createItem: async (payload: Record<string, unknown>) => apiClient.post('/re-invoice-items', payload),
  updateItem: async (id: number, payload: Record<string, unknown>) => apiClient.patch(`/re-invoice-items/${id}`, payload),
  deleteItem: async (id: number) => apiClient.delete(`/re-invoice-items/${id}`),
};
