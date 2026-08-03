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
  ReceiptText,
  X,
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
import { InvoicesTable } from '@/features/invoices/components/invoices.table';
import { InvoicesDialog } from '@/features/invoices/components/invoices.dialog';
import { useInvoices } from '@/features/invoices/invoices.hooks';

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
  const expenseFilterId = Number(searchParams.get('expenseId') || 0) || null;

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
  const [invoiceCreateOpen, setInvoiceCreateOpen] = useState(false);
  const [selectedExpenseForInvoiceCreate, setSelectedExpenseForInvoiceCreate] = useState<any | null>(null);

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
  const filteredExpense = expenseFilterId
    ? fundExpenses.find((expense) => expense.id === expenseFilterId) ?? null
    : null;

  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const fundInvoicesQuery = useInvoices({
    paginate: true,
    per_page: 1000,
    page: 1,
    ...filters,
  });
  const invoiceCountsByExpenseId = useMemo(() => {
    const result = new Map<number, number>();
    for (const invoice of fundInvoicesQuery.data?.data ?? []) {
      const expenseId = invoice.expense_id ?? invoice.expense?.id;
      if (expenseId) result.set(expenseId, (result.get(expenseId) ?? 0) + 1);
    }
    return result;
  }, [fundInvoicesQuery.data]);

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
        <TabsList className="mb-5 max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="revenues">
            <TrendingUp className="ml-2 size-4" />
            الإيرادات
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <ArrowDownToLine className="ml-2 size-4" />
            المصروفات
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <ReceiptText className="ml-2 size-4" />
            الفواتير
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
              setSearchParams((previous) => {
                previous.set('fundTab', 'invoices');
                previous.set('expenseId', String(expense.id));
                return previous;
              });
            }}
            onAddInvoice={(expense) => {
              setSelectedExpenseForInvoiceCreate(expense);
              setInvoiceCreateOpen(true);
            }}
            invoiceCountsByExpenseId={invoiceCountsByExpenseId}
            invoicesLoading={fundInvoicesQuery.isLoading}
            invoicesError={fundInvoicesQuery.isError}
          />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">فواتير الصندوق</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              تُنشأ الفاتورة من إجراء الفاتورة داخل جدول المصروفات، وتظهر هنا بعد ربطها بالصندوق.
            </p>
          </div>
          {expenseFilterId && (
            <div className="flex flex-col gap-3 rounded-lg bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-muted-foreground">المصروف الجاري عرض فواتيره</p>
                <p className="font-medium text-foreground">
                  {filteredExpense?.description ?? `المصروف #${expenseFilterId}`}
                  {filteredExpense ? ` · ${Number(filteredExpense.amount).toLocaleString()}` : ''}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSearchParams((previous) => {
                    previous.delete('expenseId');
                    return previous;
                  });
                }}
              >
                <X className="ml-2 size-4" />
                إلغاء الفلتر
              </Button>
            </div>
          )}
          <div className="min-w-0 overflow-x-auto">
            <InvoicesTable
              filters={{
                ...filters,
                ...(expenseFilterId ? { 'filter[expense_id]': expenseFilterId } : {}),
              }}
              perPage={5}
              editInDialog
            />
          </div>
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

      <InvoicesDialog
        isOpen={invoiceCreateOpen}
        onClose={() => {
          setInvoiceCreateOpen(false);
          setSelectedExpenseForInvoiceCreate(null);
        }}
        fixedValues={selectedExpenseForInvoiceCreate ? {
          expense_id: selectedExpenseForInvoiceCreate.id,
        } : undefined}
      />


      {transferDialogOpen && (
        <TransfersDialog
          open={transferDialogOpen}
          onOpenChange={(open) => {
            setTransferDialogOpen(open);
            if (!open) setSelectedTransfer(null);
          }}
          morph_from_type={modelType as any}
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

    </div>
  );
}
