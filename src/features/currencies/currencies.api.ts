import { apiClient } from '@/shared/api/axios.instance';
import type { Currency, CreateCurrencyPayload, UpdateCurrencyPayload } from './types';

export const currenciesApi = {
  getCurrencies: async (): Promise<Currency[]> => {
    const response = await apiClient.get('/currencies');
    return response.data;
  },

  getCurrencyById: async (id: number): Promise<Currency> => {
    const response = await apiClient.get(`/currencies/${id}`);
    return response.data;
  },

  createCurrency: async (payload: CreateCurrencyPayload): Promise<Currency> => {
    const response = await apiClient.post('/currencies', payload);
    return response.data;
  },

  updateCurrency: async (id: number, payload: UpdateCurrencyPayload): Promise<Currency> => {
    const response = await apiClient.patch(`/currencies/${id}`, payload);
    return response.data;
  },

  deleteCurrency: async (id: number): Promise<void> => {
    await apiClient.delete(`/currencies/${id}`);
  },
};
