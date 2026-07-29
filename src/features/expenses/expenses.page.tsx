import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { expensesApi } from './expenses.api';
import { ExpensesTable } from './components/expenses.table';
import { ExpenseDetailsDialog } from './components/expense-details.dialog';
import type { Expense } from './types';
import { ReceiptText } from 'lucide-react';

const expensesQueryKeys = {
  all: ['expenses'] as const,
};

export function ExpensesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);

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

  const handleView = (expense: Expense) => {
    setSelectedExpenseId(expense.id);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        badge="المصروفات"
        title="المصروفات"
        icon={ReceiptText}
        action={
          <Button type="button" onClick={() => navigate('/expenses/new')}>
            إضافة مصروف جديد
          </Button>
        }
      />

      <ExpensesTable
        data={expensesQuery.data ?? []}
        loading={expensesQuery.isLoading}
        onView={handleView}
        onEdit={(expense) => navigate(`/expenses/new?expenseId=${expense.id}`)}
        onDelete={handleDelete}
      />

      <ExpenseDetailsDialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedExpenseId(null);
        }}
        expenseId={selectedExpenseId}
      />
    </div>
  );
}
