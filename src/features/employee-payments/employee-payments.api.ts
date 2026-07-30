import { apiClient } from '@/shared/api/axios.instance';
import type { CreateEmployeePaymentPayload, EmployeePayment, UpdateEmployeePaymentPayload } from './types';
import type { PaginationMeta } from '@/components/ui/pagination';

export type EmployeePaymentResponse = {
  data: EmployeePayment[];
  meta?: PaginationMeta;
};

export const employeePaymentsApi = {
  getEmployeePayments: async (page = 1, perPage = 50): Promise<EmployeePaymentResponse> => {
    const response = await apiClient.get('/employee-payments', {
      params: { paginate: true, page, per_page: perPage },
    });
    if (Array.isArray(response.data)) {
      return { data: response.data };
    }
    return {
      data: response.data?.data ?? [],
      meta: response.data?.meta,
    };
  },
  createEmployeePayment: async (payload: CreateEmployeePaymentPayload): Promise<EmployeePayment> => {
    const response = await apiClient.post('/employee-payments', payload);
    return response.data;
  },
  updateEmployeePayment: async (id: number, payload: UpdateEmployeePaymentPayload): Promise<EmployeePayment> => {
    const response = await apiClient.patch(`/employee-payments/${id}`, payload);
    return response.data;
  },
  deleteEmployeePayment: async (id: number): Promise<void> => {
    await apiClient.delete(`/employee-payments/${id}`);
  },
};
