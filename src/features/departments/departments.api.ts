import { apiClient } from '@/shared/api/axios.instance';
import type { Department, CreateDepartmentPayload, UpdateDepartmentPayload } from './types';

export const departmentsApi = {
  getAll: () => apiClient.get<Department[]>('/departments').then(res => res.data),
  create: (payload: CreateDepartmentPayload) => apiClient.post<Department>('/departments', payload),
  update: (id: number, payload: UpdateDepartmentPayload) => apiClient.patch<Department>(`/departments/${id}`, payload),
  delete: (id: number) => apiClient.delete(`/departments/${id}`),
};
