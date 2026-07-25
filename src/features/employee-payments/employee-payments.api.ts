import { apiClient } from '@/shared/api/axios.instance';
import type { CreateEmployeePaymentPayload, EmployeePayment, UpdateEmployeePaymentPayload } from './types';

export const employeePaymentsApi = {
  getEmployeePayments: async (): Promise<EmployeePayment[]> => {
    const response = await apiClient.get('/employee-payments');
    return Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
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
