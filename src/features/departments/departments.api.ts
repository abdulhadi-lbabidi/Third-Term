import { ApiClient } from '@/shared/api/api-client';
import type { Department, CreateDepartmentPayload, UpdateDepartmentPayload } from './types';

export const departmentsApi = {
  getAll: () => ApiClient.get<Department[]>('/departments').then(res => res.data),
  create: (payload: CreateDepartmentPayload) => ApiClient.post<Department>('/departments', payload, { successMessage: "تمت الإضافة بنجاح" }),
  update: (id: number, payload: UpdateDepartmentPayload) => ApiClient.patch<Department>(`/departments/${id}`, payload, { successMessage: "تم التعديل بنجاح" }),
  delete: (id: number) => ApiClient.delete(`/departments/${id}`, { successMessage: "تم الحذف بنجاح" }),
};
