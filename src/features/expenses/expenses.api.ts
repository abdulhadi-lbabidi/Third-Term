import { apiClient } from '@/shared/api/axios.instance';
import { toExpenseApiPayload } from './expenses.payload';
import type { CreateExpensePayload, Expense, UpdateExpensePayload } from './types';
import type { PaginationMeta } from '@/components/ui/pagination';

export type ExpenseResponse = {
  data: Expense[];
  meta?: PaginationMeta;
};

export const expensesApi = {
  getExpenses: async (page = 1, perPage = 50): Promise<ExpenseResponse> => {
    const response = await apiClient.get('/expenses', {
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

  getExpenseById: async (id: number): Promise<Expense> => {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data?.data ?? response.data;
  },

  createExpense: async (payload: CreateExpensePayload): Promise<Expense> => {
    const body = toExpenseApiPayload(payload);
    const response = await apiClient.post('/expenses', body);
    return response.data?.data ?? response.data;
  },

  updateExpense: async (id: number, payload: UpdateExpensePayload): Promise<Expense> => {
    const body = toExpenseApiPayload(payload);
    const response = await apiClient.patch(`/expenses/${id}`, body);
    return response.data?.data ?? response.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  },
};
