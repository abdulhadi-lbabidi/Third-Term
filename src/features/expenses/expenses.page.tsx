import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { expensesApi } from './expenses.api';
import { ExpensesTable } from './components/expenses.table';
import type { Expense } from './types';

const expensesQueryKeys = {
  all: ['expenses'] as const,
};

export function ExpensesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const expensesQuery = useQuery<Expense[]>({
    queryKey: expensesQueryKeys.all,
    queryFn: () => expensesApi.getExpenses(),
  });

  const deleteMutation = useMutation({
    mutationFn: (expense: Expense) => expensesApi.deleteExpense(expense.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all });
    },
  });

  const handleDelete = async (expense: Expense) => {
    await deleteMutation.mutateAsync(expense);
    toast.success('تم حذف المصروف بنجاح');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        badge="المصروفات"
        title="المصروفات"
        action={
          <Button
            type="button"
            onClick={() => navigate('/expenses/new')}
            className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
          >
            إضافة مصروف جديد
          </Button>
        }
      />

      <ExpensesTable
        data={expensesQuery.data ?? []}
        loading={expensesQuery.isLoading}
        onEdit={(expense) => navigate(`/expenses/new?expenseId=${expense.id}`)}
        onDelete={handleDelete}
      />
    </div>
  );
}
