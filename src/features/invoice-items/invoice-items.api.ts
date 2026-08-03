import { apiClient } from '@/shared/api/axios.instance';
import type {
  CreateInvoiceItemPayload,
  InvoiceItem,
  InvoiceItemResponse,
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

  getInvoiceItems: async (
    page = 1,
    perPage = 10,
    filters?: Record<string, string | number | boolean | undefined>,
  ): Promise<InvoiceItemResponse> => {
    const response = await apiClient.get('/invoice-items', {
      params: { paginate: true, per_page: perPage, page, ...filters },
    });
    if (Array.isArray(response.data)) {
      return { data: response.data };
    }
    return {
      data: response.data?.data ?? [],
      meta: response.data?.meta,
    };
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
