import { apiClient } from '@/shared/api/axios.instance';
import type { PaginationMeta } from '@/components/ui/pagination';
import type { CreateIncrementPayload, Increment, UpdateIncrementPayload } from './types';

export type IncrementResponse = {
  data: Increment[];
  meta?: PaginationMeta;
};

export type IncrementFilters = {
  search?: string;
  date?: string;
  employee_id?: number;
};

export const incrementsApi = {
  getIncrements: async (
    page = 1,
    perPage = 50,
    sort?: string,
    filters?: IncrementFilters,
  ): Promise<IncrementResponse> => {
    const response = await apiClient.get('/increments', {
      params: {
        paginate: true,
        page,
        per_page: perPage,
        sort,
        'filter[search]': filters?.search || undefined,
        'filter[date]': filters?.date || undefined,
        'filter[employee_id]': filters?.employee_id || undefined,
      },
    });

    if (Array.isArray(response.data)) {
      return { data: response.data };
    }

    return {
      data: response.data?.data ?? [],
      meta: response.data?.meta,
    };
  },

  getIncrement: async (id: number): Promise<Increment> => {
    const response = await apiClient.get(`/increments/${id}`);
    return response.data;
  },

  createIncrement: async (payload: CreateIncrementPayload): Promise<Increment> => {
    const response = await apiClient.post('/increments', payload);
    return response.data;
  },

  updateIncrement: async (id: number, payload: UpdateIncrementPayload): Promise<Increment> => {
    const response = await apiClient.patch(`/increments/${id}`, payload);
    return response.data;
  },

  deleteIncrement: async (id: number): Promise<void> => {
    await apiClient.delete(`/increments/${id}`);
  },
};
