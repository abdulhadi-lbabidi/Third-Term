import { apiClient } from '@/shared/api/axios.instance';
import type { Currency, CreateCurrencyPayload } from './types';
import type { PaginationMeta } from '@/components/ui/pagination';

export type CurrencyResponse = {
  data: Currency[];
  meta?: PaginationMeta;
};

export const currenciesApi = {
  getAll: async (page = 1, perPage = 50, sort?: string, search?: string): Promise<CurrencyResponse> => {
    const response = await apiClient.get('/currencies', {
      params: { paginate: true, page, per_page: perPage, sort, 'filter[search]': search || undefined },
    });
    if (Array.isArray(response.data)) {
      return { data: response.data };
    }
    return {
      data: response.data?.data ?? [],
      meta: response.data?.meta,
    };
  },
  create: (payload: CreateCurrencyPayload) => apiClient.post<Currency>('/currencies', payload).then(({ data }: any) => data?.data ?? data),
  update: (id: number, payload: CreateCurrencyPayload) => apiClient.patch<Currency>(`/currencies/${id}`, payload).then(({ data }: any) => data?.data ?? data),
  delete: (id: number) => apiClient.delete(`/currencies/${id}`).then(({ data }: any) => data?.data ?? data),
};
