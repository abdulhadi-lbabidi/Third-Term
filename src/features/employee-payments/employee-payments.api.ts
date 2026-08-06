import { apiClient } from '@/shared/api/axios.instance';
import type { CreateEmployeePaymentPayload, EmployeePayment, UpdateEmployeePaymentPayload } from './types';
import type { PaginationMeta } from '@/components/ui/pagination';

export type EmployeePaymentResponse = {
  data: EmployeePayment[];
  meta?: PaginationMeta;
};

export type EmployeePaymentFilters = {
  search?: string;
  payment_date?: string;
  date_from?: string;
  date_to?: string;
};

export const employeePaymentsApi = {
  getEmployeePayments: async (
    page = 1,
    perPage = 50,
    sort?: string,
    filters?: EmployeePaymentFilters
  ): Promise<EmployeePaymentResponse> => {
    const response = await apiClient.get('/employee-payments', {
      params: {
        paginate: true,
        page,
        per_page: perPage,
        sort,
        'filter[search]': filters?.search || undefined,
        'filter[payment_date]': filters?.payment_date || undefined,
        'filter[date_from]': filters?.date_from || undefined,
        'filter[date_to]': filters?.date_to || undefined,
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
