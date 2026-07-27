import { apiClient } from '@/shared/api/axios.instance';
import type { CreateExpensePayload, Expense, UpdateExpensePayload } from './types';

export const expensesApi = {
  getExpenses: async (): Promise<Expense[]> => {
    const response = await apiClient.get('/expenses');
    const payload = response.data as { data?: Expense[] } | Expense[];
    return Array.isArray(payload) ? payload : payload.data ?? [];
  },

  getExpenseById: async (id: number): Promise<Expense> => {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data;
  },

  createExpense: async (payload: CreateExpensePayload): Promise<Expense> => {
    const response = await apiClient.post('/expenses', payload);
    return response.data;
  },

  updateExpense: async (id: number, payload: UpdateExpensePayload): Promise<Expense> => {
    const response = await apiClient.patch(`/expenses/${id}`, payload);
    return response.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  },
};
