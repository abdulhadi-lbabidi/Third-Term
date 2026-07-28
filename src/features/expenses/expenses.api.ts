import { apiClient } from '@/shared/api/axios.instance';
import { toExpenseApiPayload } from './expenses.payload';
import type { CreateExpensePayload, Expense, UpdateExpensePayload } from './types';

export const expensesApi = {
  getExpenses: async (): Promise<Expense[]> => {
    const response = await apiClient.get('/expenses');
    const payload = response.data as { data?: Expense[] } | Expense[];
    return Array.isArray(payload) ? payload : payload.data ?? [];
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
    // نفس body الإضافة بالضبط
    const body = toExpenseApiPayload(payload);
    const response = await apiClient.patch(`/expenses/${id}`, body);
    return response.data?.data ?? response.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  },
};
