import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/features/expenses/expenses.hooks';
import { ExpensesTable } from '@/features/expenses/components/expenses.table';
import { ExpensesDialog } from '@/features/expenses/components/expenses.dialog';
import { ExpenseDetailsDialog } from '@/features/expenses/components/expense-details.dialog';
import type { Expense } from '@/features/expenses/types';
import type { Fund } from '../types';

type FundExpensesProps = {
  fund: Fund | null;
};

export function FundExpenses({ fund }: FundExpensesProps) {
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseDetailsOpen, setExpenseDetailsOpen] = useState(false);
  const [selectedExpenseForView, setSelectedExpenseForView] = useState<number | null>(null);

  const expensesQuery = useExpenses();
  const allExpenses = expensesQuery.data?.data ?? (Array.isArray(expensesQuery.data) ? expensesQuery.data : []);
  const isLoadingExpenses = expensesQuery.isLoading;
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const fundExpenses = allExpenses.filter((e) => {
    if (e.expenseable_type !== 'App\\Models\\CurrencyFund') return false;

    // The expenseable_id points to the CurrencyFund (pivot) ID, not the Fund ID.
    // Check if the expenseable_info contains the fund_id.
    const info = e.expenseable_info as any;
    if (info?.details?.fund_id === fund?.id) return true;

    // Fallback: Check if the expenseable_id matches any of the fund's currencies IDs
    if (fund?.currencies) {
      return fund.currencies.some((c) => c.id === e.expenseable_id);
    }

    return false;
  });

  const handleExpenseSubmit = async (data: any) => {
    if (selectedExpense) {
      await updateExpenseMutation.mutateAsync({ id: selectedExpense.id, payload: data });
    } else {
      await createExpenseMutation.mutateAsync(data);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">مصروفات الصندوق</h3>
        <Button
          onClick={() => {
            setSelectedExpense(null);
            setExpenseDialogOpen(true);
          }}
          className="bg-slate-950 text-white"
        >
          <PlusCircle className="mr-2 size-4" />
          إضافة مصروف
        </Button>
      </div>

      <ExpensesTable
        data={fundExpenses}
        loading={isLoadingExpenses}
        onView={(expense) => {
          setSelectedExpenseForView(expense.id);
          setExpenseDetailsOpen(true);
        }}
        onEdit={(expense) => {
          setSelectedExpense(expense);
          setExpenseDialogOpen(true);
        }}
        onDelete={async (expense) => {
          await deleteExpenseMutation.mutateAsync(expense.id);
        }}
      />

      <ExpensesDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        defaultValues={selectedExpense}
        fixedValues={
          fund
            ? {
              source: 'user_fund',
              user_id: fund.user?.id,
              user_fund_id: fund.id,
            }
            : undefined
        }
        onSubmit={handleExpenseSubmit}
        loading={createExpenseMutation.isPending || updateExpenseMutation.isPending}
      />

      <ExpenseDetailsDialog
        open={expenseDetailsOpen}
        onOpenChange={(open) => {
          setExpenseDetailsOpen(open);
          if (!open) setSelectedExpenseForView(null);
        }}
        expenseId={selectedExpenseForView}
      />
    </div>
  );
}
