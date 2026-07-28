import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { ExpensesForm } from './components/expenses.form';
import { expensesApi } from './expenses.api';
import type { CreateExpensePayload, Expense } from './types';

const expensesQueryKeys = {
  all: ['expenses'] as const,
};

export function NewExpensePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const expenseId = Number(searchParams.get('expenseId') || '');
  const hasExpenseId = Number.isFinite(expenseId) && expenseId > 0;

  const expenseQuery = useQuery<Expense>({
    queryKey: ['expenses', expenseId] as const,
    queryFn: () => expensesApi.getExpenseById(expenseId),
    enabled: hasExpenseId,
  });
  const isEditMode = hasExpenseId;

  const defaultValues = useMemo<Expense | null>(() => {
    const expense = expenseQuery.data;
    if (!expense) return null;

    const source = expense.expenseable_info?.type ?? expense.expenseable_type;

    const expenseUser = expense.user && typeof expense.user === 'object' ? expense.user : undefined;

    return {
      ...expense,
      expenseable_type: expense.expenseable_type,
      expenseable_id: expense.expenseable_id ?? expense.expenseable_info?.id,
      user: expense.user,
      user_role: expense.user_role ?? expenseUser?.role_type,
      user_id: expense.user_id ?? expenseUser?.id,
      created_by_name: expense.created_by_name,
      expenseable_info: expense.expenseable_info,
      ...(source === 'company_fund'
        ? {
            company_fund_id: expense.expenseable_info?.company_fund_id ?? expense.expenseable_info?.id,
          }
        : source === 'project_fund'
          ? {
              project_id: expense.expenseable_info?.project_id,
            }
          : {}),
    };
  }, [expenseQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) => {
      if (isEditMode) {
        return expensesApi.updateExpense(expenseId, payload);
      }
      return expensesApi.createExpense(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all });
      navigate('/expenses', { replace: true });
    },
  });

  const handleSubmit = async (payload: CreateExpensePayload) => {
    await saveMutation.mutateAsync(payload);
    toast.success(isEditMode ? 'تم تعديل المصروف بنجاح' : 'تم إضافة المصروف بنجاح');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        badge="المصروفات"
        title={isEditMode ? 'تعديل مصروف' : 'إضافة مصروف'}
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/expenses')}
            className="h-11 rounded-lg border-slate-200 px-5 text-sm font-semibold"
          >
            رجوع
          </Button>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <ExpensesForm defaultValues={defaultValues} onSubmit={handleSubmit} loading={saveMutation.isPending} />
      </div>
    </div>
  );
}
