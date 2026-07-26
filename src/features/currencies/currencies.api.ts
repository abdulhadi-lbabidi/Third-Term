import { apiClient } from '@/shared/api/axios.instance';
import type { Currency, CreateCurrencyPayload } from './types';

export const currenciesApi = {
  getAll: () => apiClient.get<Currency[]>('/currencies').then(res => res.data),
  create: (payload: CreateCurrencyPayload) => apiClient.post<Currency>('/currencies', payload),
  update: (id: number, payload: CreateCurrencyPayload) => apiClient.patch<Currency>(`/currencies/${id}`, payload),
  delete: (id: number) => apiClient.delete(`/currencies/${id}`),
};
