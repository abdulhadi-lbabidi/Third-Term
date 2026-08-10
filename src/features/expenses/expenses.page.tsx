import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { expensesApi } from './expenses.api';
import { useCreateExpense, useExpenses, useUpdateExpense } from './expenses.hooks';
import { ExpensesTable } from './components/expenses.table';
import { ExpensesDialog } from './components/expenses.dialog';
import { InvoicesDialog } from '@/features/invoices/components/invoices.dialog';
import { ExpenseDetailsDialog } from './components/expense-details.dialog';
import type { Expense } from './types';
import { ReceiptText, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

import { type DateTimeRangeValue } from '@/shared/components/ui/date-time-range-picker';
import { FilterDrawer } from '@/shared/components/ui/filter-drawer';
import { ExpensesFilterForm } from './components/expenses-filter.form';
import type { UserRole } from '@/features/users/types';
import { cn } from '@/shared/lib/utils';
import { format } from 'date-fns';

export function ExpensesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [invoiceExpenseId, setInvoiceExpenseId] = useState<number | null>(null);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPosted, setIsPosted] = useState<string>('');

  const [userRole, setUserRole] = useState<UserRole | ''>('');
  const [userId, setUserId] = useState<number | ''>('');

  const [creatorRole, setCreatorRole] = useState<UserRole | ''>('');
  const [creatorId, setCreatorId] = useState<number | ''>('');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [sort, setSort] = useState<string | undefined>(undefined);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});

  const rangeValue = useMemo(() => {
    return {
      from: dateFrom ? new Date(dateFrom) : undefined,
      to: dateTo ? new Date(dateTo) : undefined,
    };
  }, [dateFrom, dateTo]);

  const handleRangeChange = (value: DateTimeRangeValue | undefined) => {
    setDateFrom(value?.from ? format(value.from, 'yyyy-MM-dd HH:mm:ss') : '');
    setDateTo(value?.to ? format(value.to, 'yyyy-MM-dd HH:mm:ss') : '');
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      'filter[search]': searchQuery || undefined,
      'filter[is_posted]': isPosted === 'true' ? true : isPosted === 'false' ? false : undefined,
      'filter[user_id]': userId || undefined,
      'filter[created_by]': creatorId || undefined,
      'filter[date_from]': dateFrom || undefined,
      'filter[date_to]': dateTo || undefined,
    });
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setIsPosted('');
    setUserRole('');
    setUserId('');
    setCreatorRole('');
    setCreatorId('');
    setDateFrom('');
    setDateTo('');
    setAppliedFilters({});
    setPage(1);
    queryClient.invalidateQueries({
      queryKey: ['expenses', 1, perPage, { sort: sort || undefined }],
    });
    queryClient.invalidateQueries({
      queryKey: ['expenses', 1, perPage, { sort: undefined }],
    });
  };



  const expensesQuery = useExpenses(page, perPage, {
    ...appliedFilters,
    sort: sort || undefined,
  });

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
          <div className="flex shrink-0 items-center gap-3">
            {(Object.values(appliedFilters).some(Boolean) || sort) ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  handleResetFilters();
                  setSort(undefined);
                }}
                aria-label="إعادة ضبط الفلاتر"
                title="إعادة ضبط الفلاتر"
              >
                <RotateCcw className="size-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilterDrawerOpen(true)}
              className={cn(Object.values(appliedFilters).some(Boolean) && "border-primary text-primary")}
            >
              <SlidersHorizontal className="size-4" />
              فلترة متقدمة
            </Button>
            <Button type="button" onClick={() => { setExpenseToEdit(null); setExpenseDialogOpen(true); }}>
              إضافة مصروف جديد
            </Button>
          </div>
        }
      />

      <ExpensesTable
        data={expenses}
        loading={expensesQuery.isLoading}
        onView={handleView}
        onEdit={(expense) => { setExpenseToEdit(expense); setExpenseDialogOpen(true); }}
        onDelete={handleDelete}
        onAddInvoice={(expense) => setInvoiceExpenseId(expense.id)}
        sort={sort}
        onSortChange={setSort}
      />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        
        onPageChange={setPage}
        meta={meta}
        limit={perPage}
        limitOptions={[5, 10, 20, 50, 100]}
        onLimitChange={setPerPage}
      />

      <ExpenseDetailsDialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedExpenseId(null);
        }}
        expenseId={selectedExpenseId}
      />

      <ExpensesDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        defaultValues={expenseToEdit}
        loading={createExpense.isPending || updateExpense.isPending}
        onSubmit={async (payload) => {
          if (expenseToEdit) await updateExpense.mutateAsync({ id: expenseToEdit.id, payload });
          else await createExpense.mutateAsync(payload);
        }}
      />

      <InvoicesDialog
        isOpen={invoiceExpenseId !== null}
        onClose={() => setInvoiceExpenseId(null)}
        fixedValues={invoiceExpenseId ? { expense_id: invoiceExpenseId } : undefined}
      />

      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      >
        <ExpensesFilterForm
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isPosted={isPosted}
          setIsPosted={setIsPosted}
          userRole={userRole}
          setUserRole={setUserRole}
          userId={userId}
          setUserId={setUserId}
          creatorRole={creatorRole}
          setCreatorRole={setCreatorRole}
          creatorId={creatorId}
          setCreatorId={setCreatorId}
          rangeValue={rangeValue}
          handleRangeChange={handleRangeChange}
        />
      </FilterDrawer>
    </div>
  );
}
