import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { expensesApi, type ExpenseResponse } from './expenses.api';
import type { CreateExpensePayload, UpdateExpensePayload } from './types';

const expensesQueryKeys = {
  all: ['expenses'] as const,
  list: (page: number, perPage: number, filters?: Record<string, any>) => ['expenses', page, perPage, filters] as const,
};

export function useExpenses(page = 1, perPage = 50, filters?: Record<string, any>, enabled = true) {
  return useQuery<ExpenseResponse>({
    queryKey: expensesQueryKeys.list(page, perPage, filters),
    queryFn: () => expensesApi.getExpenses(page, perPage, filters),
    enabled,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => expensesApi.createExpense(payload),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['project-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['funds'] });
      toast.success('تم إضافة المصروف بنجاح');

      const details = data?.expenseable_info?.details as any;
      if (details) {
        const fund = details.project_fund || details.company_fund || details.fund;
        const threshold = fund?.threshold;
        const balance = details.balance;
        const currencySymbol = details.currency?.symbol || details.currency?.currency || '';
        const fundName = fund?.name || '';

        if (threshold !== undefined && balance !== undefined) {
          const numBalance = Number(balance);
          const numThreshold = Number(threshold);
          if (numBalance < numThreshold) {
            toast.error(`تنبيه: رصيد الصندوق "${fundName}" أصبح أقل من الحد الأدنى المسموح به (${numThreshold.toLocaleString()} ${currencySymbol})! الرصيد الحالي: ${numBalance.toLocaleString()} ${currencySymbol}`, {
              duration: 8000,
            });
          }
        }
      }
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
      await queryClient.invalidateQueries({ queryKey: ['public-expenses'] });
      await queryClient.invalidateQueries({ queryKey: ['public-project-details'] });
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'projects' && typeof query.queryKey[1] === 'number',
        refetchType: 'active',
      });
      toast.success('تم حذف المصروف بنجاح');
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف المصروف');
    },
  });
}
