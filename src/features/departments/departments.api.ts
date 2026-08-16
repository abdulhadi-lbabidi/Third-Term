import { apiClient } from '@/shared/api/axios.instance';
import type { Department, CreateDepartmentPayload, UpdateDepartmentPayload } from './types';
import type { PaginationMeta } from '@/components/ui/pagination';

export type DepartmentResponse = {
  data: Department[];
  meta?: PaginationMeta;
};

export const departmentsApi = {
  getAll: async (page = 1, perPage = 50, filters?: Record<string, any>): Promise<DepartmentResponse> => {
    const response = await apiClient.get('/departments', {
      params: { paginate: true, page, per_page: perPage, ...filters },
    });
    if (Array.isArray(response.data)) {
      return { data: response.data };
    }
    return {
      data: response.data?.data ?? [],
      meta: response.data?.meta,
    };
  },
  create: (payload: CreateDepartmentPayload) => apiClient.post<Department>('/departments', payload),
  update: (id: number, payload: UpdateDepartmentPayload) => apiClient.patch<Department>(`/departments/${id}`, payload),
  delete: (id: number) => apiClient.delete(`/departments/${id}`),
  getById: (id: number): Promise<Department> => apiClient.get<any>(`/departments/${id}`).then(({ data }: any) => data?.data ?? data),
};
