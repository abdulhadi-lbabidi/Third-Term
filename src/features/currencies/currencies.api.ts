import { apiClient } from '@/shared/api/axios.instance';
import type { Currency, CreateCurrencyPayload } from './types';

export const currenciesApi = {
  getAll: () => apiClient.get<Currency[]>('/currencies').then(({ data }: any) => data?.data),
  create: (payload: CreateCurrencyPayload) => apiClient.post<Currency>('/currencies', payload).then(({ data }: any) => data?.data),
  update: (id: number, payload: CreateCurrencyPayload) => apiClient.patch<Currency>(`/currencies/${id}`, payload).then(({ data }: any) => data?.data),
  delete: (id: number) => apiClient.delete(`/currencies/${id}`).then(({ data }: any) => data?.data),
};
