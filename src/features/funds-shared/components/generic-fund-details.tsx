import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import {
  TrendingUp,
  ArrowDownToLine,
  ArrowRight,
  Edit2,
  Trash2,
  Banknote,
  PlusCircle,
  ArrowLeftRight,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';

import { useRevenues, useCreateRevenue, useUpdateRevenue, useDeleteRevenue } from '@/features/revenues/revenues.hooks';
import { RevenuesTable } from '@/features/revenues/components/revenues.table';
import { RevenuesDialog } from '@/features/revenues/components/revenues.dialog';

import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/features/expenses/expenses.hooks';
import { ExpensesTable } from '@/features/expenses/components/expenses.table';
import { ExpensesDialog } from '@/features/expenses/components/expenses.dialog';
import { ExpenseDetailsDialog } from '@/features/expenses/components/expense-details.dialog';
import { ExpenseInvoicesDialog } from '@/features/expenses/components/expense-invoices.dialog';

import { useTransfers, useCreateTransfer, useUpdateTransfer, useDeleteTransfer } from '@/features/transfers/transfers.hooks';
import { TransfersTable } from '@/features/transfers/components/transfers.table';
import { TransfersDialog } from '@/features/transfers/components/transfers.dialog';

type GenericFundDetailsProps = {
  fundId: number;
  fundName: string;
  fundCurrencies: {
    id: number;
    currency: string;
    symbol: string;
    balance: string;
  }[];
  onBack?: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onAttachCurrency: () => void;

  modelType: string;
  sourceType: any;
  fundIdField: 'company_fund_id' | 'project_fund_id' | 'user_fund_id';
  extraDetails?: React.ReactNode;
  extraFixedValues?: Record<string, any>;
};

export function GenericFundDetails({
  fundId,
  fundName,
  fundCurrencies,
  onBack,
  onEdit,
  onDelete,
  onAttachCurrency,
  modelType,
  sourceType,
  fundIdField,
  extraDetails,
  extraFixedValues,
}: GenericFundDetailsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('fundTab') || 'revenues';

  const handleTabChange = (value: string) => {
    setSearchParams((prev) => {
      prev.set('fundTab', value);
      return prev;
    });
  };

  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<any | null>(null);

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [expenseDetailsOpen, setExpenseDetailsOpen] = useState(false);
  const [selectedExpenseForView, setSelectedExpenseForView] = useState<number | null>(null);
  const [expenseInvoicesOpen, setExpenseInvoicesOpen] = useState(false);
  const [selectedExpenseForInvoices, setSelectedExpenseForInvoices] = useState<any | null>(null);

  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null);

  const apiFilterField = fundIdField === 'user_fund_id' ? 'fund_id' : fundIdField;
  const filters = { [`filter[${apiFilterField}]`]: fundId };

  const revenuesQuery = useRevenues(1, 50, filters);
  const fundRevenues = revenuesQuery.data?.data ?? [];
  const isLoadingRevenues = revenuesQuery.isLoading;

  const createRevenueMutation = useCreateRevenue();
  const updateRevenueMutation = useUpdateRevenue();
  const deleteRevenueMutation = useDeleteRevenue();

  const handleRevenueSubmit = async (data: any) => {
    if (selectedRevenue) {
      await updateRevenueMutation.mutateAsync({ id: selectedRevenue.id, payload: data });
    } else {
      await createRevenueMutation.mutateAsync(data);
    }
  };

  const expensesQuery = useExpenses(1, 50, filters);
  const fundExpenses = expensesQuery.data?.data ?? [];
  const isLoadingExpenses = expensesQuery.isLoading;

  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const handleExpenseSubmit = async (data: any) => {
    if (selectedExpense) {
      await updateExpenseMutation.mutateAsync({ id: selectedExpense.id, payload: data });
    } else {
      await createExpenseMutation.mutateAsync(data);
    }
  };

  const transfersFilters = useMemo(() => {
    const apiFilterField = fundIdField === 'user_fund_id' ? 'fund_id' : fundIdField;
    return {
      paginate: false,
      [`filter[${apiFilterField}]`]: fundId,
    };
  }, [fundIdField, fundId]);

  const transfersQuery = useTransfers(1, 50, transfersFilters);
  const createTransferMutation = useCreateTransfer();
  const updateTransferMutation = useUpdateTransfer();
  const deleteTransferMutation = useDeleteTransfer();

  const fundTransfers = useMemo(() => {
    return transfersQuery.data?.data ?? [];
  }, [transfersQuery.data?.data]);

  return (
    <div className="flex flex-col space-y-6 bg-white p-4 rounded-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-5">
        <div className="flex items-start gap-4">
          {onBack && (
            <Button
              variant="secondary"
              size="icon"
              onClick={onBack}
              className="mt-1 shrink-0 rounded-full"
              title="العودة"
            >
              <ArrowRight className="size-4" />
            </Button>
          )}
          <div className="space-y-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{fundName}</h2>
              {extraDetails && <div>{extraDetails}</div>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {fundCurrencies.length > 0 ? (
                fundCurrencies.map((currency) => (
                  <div key={currency.id} className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium">
                    <span className="text-slate-900">{currency.balance}</span>
                    <span className="text-slate-500">{currency.currency} {currency.symbol}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Banknote className="size-4" />
                  <span>لا يوجد عملات مرفقة</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onAttachCurrency} className="bg-slate-100 hover:bg-slate-200">
            <Banknote className="ml-2 size-4" />
            إرفاق عملة
          </Button>
          <Button variant="secondary" size="sm" onClick={onEdit} className="bg-slate-100 hover:bg-slate-200">
            <Edit2 className="ml-2 size-4" />
            تعديل
          </Button>
          <AlertDialog>
            <AlertDialogTrigger>
              <Button variant="secondary" size="sm" className="bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700">
                <Trash2 className="ml-2 size-4" />
                حذف
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف صندوق "{fundName}"؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-5 justify-start">
          <TabsTrigger value="revenues">
            <TrendingUp className="ml-2 size-4" />
            الإيرادات
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <ArrowDownToLine className="ml-2 size-4" />
            المصروفات
          </TabsTrigger>
          <TabsTrigger value="transfers">
            <ArrowLeftRight className="ml-2 size-4" />
            التحويلات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenues" className="space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">جدول الإيرادات</h4>
            <Button
              size="sm"
              onClick={() => {
                setSelectedRevenue(null);
                setRevenueDialogOpen(true);
              }}
            >
              إضافة إيراد جديد
            </Button>
          </div>

          <RevenuesTable
            data={fundRevenues}
            loading={isLoadingRevenues}
            hideTypeColumn={true}
            onEdit={(revenue) => {
              setSelectedRevenue(revenue);
              setRevenueDialogOpen(true);
            }}
            onDelete={async (revenue) => {
              await deleteRevenueMutation.mutateAsync(revenue.id);
            }}
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-5">
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
            hideTypeColumn={true}
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
            onInvoices={(expense) => {
              setSelectedExpenseForInvoices(expense);
              setExpenseInvoicesOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="transfers" className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">تحويلات الصندوق</h3>
            <Button
              onClick={() => {
                setSelectedTransfer(null);
                setTransferDialogOpen(true);
              }}
              className="bg-slate-950 text-white"
            >
              <PlusCircle className="mr-2 size-4" />
              إضافة تحويل
            </Button>
          </div>

          <TransfersTable
            data={fundTransfers}
            loading={transfersQuery.isLoading}
            onEdit={(transfer) => {
              setSelectedTransfer(transfer);
              setTransferDialogOpen(true);
            }}
            onDelete={async (transfer) => {
              await deleteTransferMutation.mutateAsync(transfer.id);
            }}
            currentFund={{
              id: fundId,
              name: fundName,
              type: sourceType,
              currencies: fundCurrencies,
            }}
          />
        </TabsContent>
      </Tabs>

      {revenueDialogOpen && (
        <RevenuesDialog
          open={revenueDialogOpen}
          onOpenChange={(open) => {
            setRevenueDialogOpen(open);
            if (!open) setSelectedRevenue(null);
          }}
          defaultValues={selectedRevenue}
          onSubmit={handleRevenueSubmit}
          loading={createRevenueMutation.isPending || updateRevenueMutation.isPending}
          fixedValues={{
            source: sourceType,
            [fundIdField]: fundId,
            ...extraFixedValues,
          }}
        />
      )}

      {expenseDialogOpen && (
        <ExpensesDialog
          open={expenseDialogOpen}
          onOpenChange={(open) => {
            setExpenseDialogOpen(open);
            if (!open) setSelectedExpense(null);
          }}
          defaultValues={selectedExpense}
          onSubmit={handleExpenseSubmit}
          loading={createExpenseMutation.isPending || updateExpenseMutation.isPending}
          fixedValues={{
            source: sourceType,
            [fundIdField]: fundId,
            ...extraFixedValues,
          }}
        />
      )}

      {expenseDetailsOpen && selectedExpenseForView && (
        <ExpenseDetailsDialog
          open={expenseDetailsOpen}
          onOpenChange={(open) => {
            setExpenseDetailsOpen(open);
            if (!open) setSelectedExpenseForView(null);
          }}
          expenseId={selectedExpenseForView}
        />
      )}

      {transferDialogOpen && (
        <TransfersDialog
          open={transferDialogOpen}
          onOpenChange={(open) => {
            setTransferDialogOpen(open);
            if (!open) setSelectedTransfer(null);
          }}
          morph_from_type={normalizedModelType as any}
          fixedFromCurrencies={fundCurrencies}
          defaultValues={selectedTransfer}
          onSubmit={async (data) => {
            if (selectedTransfer) {
              await updateTransferMutation.mutateAsync({ id: selectedTransfer.id, payload: data });
            } else {
              await createTransferMutation.mutateAsync(data);
            }
          }}
          loading={createTransferMutation.isPending || updateTransferMutation.isPending}
        />
      )}

      <ExpenseInvoicesDialog
        open={expenseInvoicesOpen}
        onOpenChange={setExpenseInvoicesOpen}
        expense={selectedExpenseForInvoices}
        fixedValues={{
          source: sourceType,
          [fundIdField]: fundId,
          ...extraFixedValues,
        }}
      />
    </div>
  );
}
