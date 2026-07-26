import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { ExpensesForm } from './components/expenses.form';
import { expensesApi } from './expenses.api';
import type { CreateExpensePayload } from './types';

const expensesQueryKeys = {
  all: ['expenses'] as const,
};

export function NewExpensePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) => expensesApi.createExpense(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all });
      navigate('/expenses', { replace: true });
    },
  });

  const handleSubmit = async (payload: CreateExpensePayload) => {
    await saveMutation.mutateAsync(payload);
    toast.success('تم إضافة المصروف بنجاح');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        badge="المصروفات"
        title="إضافة مصروف"
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
        <ExpensesForm onSubmit={handleSubmit} loading={saveMutation.isPending} />
      </div>
    </div>
  );
}

