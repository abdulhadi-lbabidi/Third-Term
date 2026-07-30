import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { expensesApi } from './expenses.api';
import { useExpenses } from './expenses.hooks';
import { ExpensesTable } from './components/expenses.table';
import { ExpenseDetailsDialog } from './components/expense-details.dialog';
import type { Expense } from './types';
import { ReceiptText } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

export function ExpensesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 50;

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);

  const expensesQuery = useExpenses(page, perPage);

  const deleteMutation = useMutation({
    mutationFn: (expense: Expense) => expensesApi.deleteExpense(expense.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
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

  const expenses = expensesQuery.data?.data ?? [];
  const meta = expensesQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex flex-col flex-1 space-y-4">
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
        data={expenses}
        loading={expensesQuery.isLoading}
        onView={handleView}
        onEdit={(expense) => navigate(`/expenses/new?expenseId=${expense.id}`)}
        onDelete={handleDelete}
      />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
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
