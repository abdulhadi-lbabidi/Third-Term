import { apiClient } from '@/shared/api/axios.instance';
import type {
  CreateInvoiceItemPayload,
  InvoiceItem,
  InvoiceOption,
  UpdateInvoiceItemPayload,
} from './types';

export const invoiceItemsApi = {
  getInvoices: async (): Promise<InvoiceOption[]> => {
    const response = await apiClient.get('/invoices', {
      params: { paginate: false },
    });
    const payload = response.data as { data?: InvoiceOption[] } | InvoiceOption[];
    return Array.isArray(payload) ? payload : payload.data ?? [];
  },

  getInvoiceItems: async (): Promise<InvoiceItem[]> => {
    const response = await apiClient.get('/invoice-items', {
      params: { paginate: true, per_page: 50, page: 1 },
    });
    const payload = response.data as { data?: InvoiceItem[] } | InvoiceItem[];
    return Array.isArray(payload) ? payload : payload.data ?? [];
  },

  getInvoiceItemById: async (id: number): Promise<InvoiceItem> => {
    const response = await apiClient.get(`/invoice-items/${id}`);
    return response.data?.data ?? response.data;
  },

  createInvoiceItem: async (payload: CreateInvoiceItemPayload): Promise<InvoiceItem> => {
    const response = await apiClient.post('/invoice-items', payload);
    return response.data?.data ?? response.data;
  },

  updateInvoiceItem: async (id: number, payload: UpdateInvoiceItemPayload): Promise<InvoiceItem> => {
    const response = await apiClient.patch(`/invoice-items/${id}`, payload);
    return response.data?.data ?? response.data;
  },

  deleteInvoiceItem: async (id: number): Promise<void> => {
    await apiClient.delete(`/invoice-items/${id}`);
  },
};
