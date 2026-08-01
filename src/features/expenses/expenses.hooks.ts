import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { expensesApi, type ExpenseResponse } from './expenses.api';
import type { CreateExpensePayload, UpdateExpensePayload } from './types';

const expensesQueryKeys = {
  all: ['expenses'] as const,
  list: (page: number, perPage: number, filters?: Record<string, any>) => ['expenses', page, perPage, filters] as const,
};

export function useExpenses(page = 1, perPage = 50, filters?: Record<string, any>) {
  return useQuery<ExpenseResponse>({
    queryKey: expensesQueryKeys.list(page, perPage, filters),
    queryFn: () => expensesApi.getExpenses(page, perPage, filters),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => expensesApi.createExpense(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['project-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['funds'] });
      toast.success('تم إضافة المصروف بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة المصروف');
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateExpensePayload }) =>
      expensesApi.updateExpense(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['project-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['funds'] });
      toast.success('تم تعديل المصروف بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تعديل المصروف');
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => expensesApi.deleteExpense(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['project-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['funds'] });
      toast.success('تم حذف المصروف بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف المصروف');
    },
  });
}
