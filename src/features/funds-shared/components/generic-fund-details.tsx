import { useState, useMemo, useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
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
  AlertTriangle,
  Undo2,
  Loader2,
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
import { FundCurrencyEmptyState } from './fund-currency-empty-state';
import { useDeleteReInvoice, useReInvoices, useSaveReInvoice } from '@/features/re-invoices/re-invoices.hooks';
import { ReInvoicesTable } from '@/features/re-invoices/components/re-invoices.table';
import { ReInvoiceDialog } from '@/features/re-invoices/components/re-invoice.dialog';
import { ReInvoiceItemsDialog } from '@/features/re-invoices/components/re-invoice-items.dialog';
import type { ReInvoice } from '@/features/re-invoices/types';

type GenericFundDetailsProps = {
  fundId: number;
  fundName: string;
  fundCurrencies: {
    id: number;
    expenseable_id?: number;
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
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('fundTab') || 'revenues';
  const expenseFilterId = Number(searchParams.get('expenseId') || 0) || null;
  const hasCurrencies = fundCurrencies.length > 0;
  const canTransfer = fundCurrencies.some((currency) => Number(currency.balance) > 0);
  const tabsDragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const tabsDraggingRef = useRef(false);
  const tabsDragMovedRef = useRef(false);

  const handleTabsPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    tabsDragMovedRef.current = false;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    tabsDraggingRef.current = true;
    tabsDragStartRef.current = {
      x: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
    };
  };

  const handleTabsPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!tabsDraggingRef.current) return;
    const distance = event.clientX - tabsDragStartRef.current.x;
    if (Math.abs(distance) > 8) tabsDragMovedRef.current = true;
    event.currentTarget.scrollLeft = tabsDragStartRef.current.scrollLeft - distance;
  };

  const stopTabsDragging = () => {
    tabsDraggingRef.current = false;
  };

  const preventTabClickAfterDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!tabsDragMovedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    tabsDragMovedRef.current = false;
  };

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
  const [reInvoiceDialogOpen, setReInvoiceDialogOpen] = useState(false);
  const [selectedReInvoice, setSelectedReInvoice] = useState<ReInvoice | null>(null);
  const [reInvoiceItemsId, setReInvoiceItemsId] = useState<number>();

  const apiFilterField = fundIdField === 'user_fund_id' ? 'fund_id' : fundIdField;
  const filters = { [`filter[${apiFilterField}]`]: fundId };
  const reInvoicesQuery = useReInvoices({ paginate: true, per_page: 5, page: 1, ...filters }, hasCurrencies && currentTab === 'returns');
  const saveReInvoice = useSaveReInvoice();
  const deleteReInvoice = useDeleteReInvoice();

  const revenuesQuery = useRevenues(1, 50, filters, hasCurrencies && currentTab === 'revenues');
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

    const projectId = Number(extraFixedValues?.project_id);
    if (Number.isFinite(projectId) && projectId > 0) {
      await queryClient.invalidateQueries({
        queryKey: ['projects', projectId],
        exact: true,
        refetchType: 'all',
      });
    }
  };

  const expensesQuery = useExpenses(1, 50, filters, hasCurrencies && currentTab === 'expenses');
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
  }, hasCurrencies && currentTab === 'invoices');
  const invoiceCountsByExpenseId = useMemo(() => {
    const result = new Map<number, number>();
    for (const invoice of fundInvoicesQuery.data?.data ?? []) {
      const expenseId = invoice.expense_id ?? invoice.expense?.id;
      if (expenseId) result.set(expenseId, (result.get(expenseId) ?? 0) + 1);
    }
    return result;
  }, [fundInvoicesQuery.data]);

  const handleExpenseSubmit = async (data: any) => {
    let savedExpense;
    if (selectedExpense) {
      savedExpense = await updateExpenseMutation.mutateAsync({ id: selectedExpense.id, payload: data });
    } else {
      savedExpense = await createExpenseMutation.mutateAsync(data);
    }

    const projectId = Number(extraFixedValues?.project_id);
    if (Number.isFinite(projectId) && projectId > 0) {
      await queryClient.invalidateQueries({
        queryKey: ['projects', projectId],
        exact: true,
        refetchType: 'all',
      });
    }
    return savedExpense;
  };

  const transfersFilters = useMemo(() => {
    const apiFilterField = fundIdField === 'user_fund_id' ? 'fund_id' : fundIdField;
    return {
      paginate: false,
      [`filter[${apiFilterField}]`]: fundId,
    };
  }, [fundIdField, fundId]);

  const transfersQuery = useTransfers(1, 50, transfersFilters, hasCurrencies && currentTab === 'transfers');
  const createTransferMutation = useCreateTransfer();
  const updateTransferMutation = useUpdateTransfer();
  const deleteTransferMutation = useDeleteTransfer();

  const fundTransfers = useMemo(() => {
    return transfersQuery.data?.data ?? [];
  }, [transfersQuery.data?.data]);

  const checkRevenuesQuery = useRevenues(1, 1, filters, !!fundId);
  const checkExpensesQuery = useExpenses(1, 1, filters, !!fundId);
  const checkTransfersQuery = useTransfers(1, 1, transfersFilters, !!fundId);

  const isCheckingTransactions = checkRevenuesQuery.isLoading || checkExpensesQuery.isLoading || checkTransfersQuery.isLoading;
  const hasRevenues = (checkRevenuesQuery.data?.data ?? []).length > 0;
  const hasExpenses = (checkExpensesQuery.data?.data ?? []).length > 0;
  const hasTransfers = (checkTransfersQuery.data?.data ?? []).length > 0;
  const hasReInvoices = (reInvoicesQuery.data?.data ?? []).length > 0;

  const hasFinancialTransactions = hasRevenues || hasExpenses || hasTransfers || hasReInvoices;

  return (
    <div className="flex min-w-0 flex-col space-y-5 rounded-xl bg-white p-0 sm:space-y-6 sm:p-4">
      <div className="flex min-w-0 flex-col gap-4 pb-3 sm:flex-row sm:items-start sm:justify-between sm:pb-5">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
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
          <div className="min-w-0 space-y-3">
            <div>
              <h2 className="break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{fundName}</h2>
              {extraDetails && <div>{extraDetails}</div>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {fundCurrencies.length > 0 ? (
                fundCurrencies.map((currency) => (
                  <div key={currency.id} className="flex min-w-0 max-w-full flex-wrap items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium">
                    <span className={Number(currency.balance) > 0 ? 'font-semibold text-success' : 'font-semibold text-destructive'}>{currency.balance}</span>
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

        <TooltipProvider>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:shrink-0">
            <Tooltip>
              <TooltipTrigger render={<Button type="button" variant="secondary" size="sm" onClick={onAttachCurrency} aria-label="إرفاق عملة" className="size-9 bg-slate-100 px-0 hover:bg-slate-200 sm:h-8 sm:w-auto sm:px-3" />}>
                <Banknote className="size-4 sm:ml-2" />
                <span className="hidden sm:inline">إرفاق عملة</span>
              </TooltipTrigger>
              <TooltipContent>إرفاق عملة</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<Button type="button" variant="secondary" size="sm" onClick={onEdit} aria-label="تعديل الصندوق" className="size-9 bg-slate-100 px-0 hover:bg-slate-200 sm:h-8 sm:w-auto sm:px-3" />}>
                <Edit2 className="size-4 sm:ml-2" />
                <span className="hidden sm:inline">تعديل</span>
              </TooltipTrigger>
              <TooltipContent>تعديل الصندوق</TooltipContent>
            </Tooltip>
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger render={<AlertDialogTrigger render={<Button variant="secondary" size="sm" aria-label="حذف الصندوق" className="size-9 bg-rose-50 px-0 text-rose-600 hover:bg-rose-100 hover:text-rose-700 sm:h-8 sm:w-auto sm:px-3" />} />}>
                  <Trash2 className="size-4 sm:ml-2" />
                  <span className="hidden sm:inline">حذف</span>
                </TooltipTrigger>
                <TooltipContent>حذف الصندوق</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                {isCheckingTransactions ? (
                  <div className="flex flex-col items-center justify-center p-6 space-y-2">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="text-xs text-slate-500">جاري التحقق من العمليات المالية...</span>
                  </div>
                ) : hasFinancialTransactions ? (
                  <>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="size-5" />
                        تعذر الحذف
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-600 text-right">
                        لا يمكن حذف صندوق "{fundName}" لأنه يحتوي على عمليات مالية مسجلة (إيرادات، مصروفات، تحويلات، أو مرتجعات). يرجى مراجعة العمليات وحذفها أولاً إن أمكن.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-950 text-white hover:bg-slate-900 hover:text-white">حسناً</AlertDialogCancel>
                    </AlertDialogFooter>
                  </>
                ) : (
                  <>
                    <AlertDialogHeader>
                      <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                      <AlertDialogDescription className="text-right">
                        هل أنت متأكد من حذف صندوق "{fundName}"؟ لا يمكن التراجع عن هذا الإجراء.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </>
                )}
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TooltipProvider>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="min-w-0 w-full">
        <div
          dir="rtl"
          className="-mx-3 mb-4 cursor-grab touch-pan-x select-none overflow-x-auto px-3 pb-1 active:cursor-grabbing sm:mx-0 sm:mb-5 sm:px-0"
          onPointerDown={handleTabsPointerDown}
          onPointerMove={handleTabsPointerMove}
          onPointerUp={stopTabsDragging}
          onPointerCancel={stopTabsDragging}
          onPointerLeave={stopTabsDragging}
          onClickCapture={preventTabClickAfterDrag}
          onDragStart={(event) => event.preventDefault()}
        >
          <TabsList className="flex h-auto w-max min-w-full justify-start [&_[data-slot=tabs-trigger]]:h-9 [&_[data-slot=tabs-trigger]]:shrink-0">
            <TabsTrigger value="revenues" disabled={!hasCurrencies}>
              <TrendingUp className="ml-2 size-4" />
              الإيرادات
            </TabsTrigger>
            <TabsTrigger value="expenses" disabled={!hasCurrencies}>
              <ArrowDownToLine className="ml-2 size-4" />
              المصروفات
            </TabsTrigger>
            <TabsTrigger value="invoices" disabled={!hasCurrencies}>
              <ReceiptText className="ml-2 size-4" />
              الفواتير
            </TabsTrigger>
            <TabsTrigger value="returns" disabled={!hasCurrencies}><Undo2 className="ml-2 size-4" />المرتجعات</TabsTrigger>
            <TabsTrigger value="transfers" disabled={!hasCurrencies}>
              <ArrowLeftRight className="ml-2 size-4" />
              التحويلات
            </TabsTrigger>
          </TabsList>
        </div>

        {!hasCurrencies && <FundCurrencyEmptyState onAddCurrency={onAttachCurrency} />}

        {hasCurrencies && <TabsContent value="revenues" className="min-w-0 space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-sm font-medium text-foreground">جدول الإيرادات</h4>
            <Button
              size="sm"
              className="w-full sm:w-auto"
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
        </TabsContent>}

        {hasCurrencies && <TabsContent value="expenses" className="min-w-0 space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-foreground">مصروفات الصندوق</h3>
            <Button
              onClick={() => {
                setSelectedExpense(null);
                setExpenseDialogOpen(true);
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
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
        </TabsContent>}

        {hasCurrencies && <TabsContent value="invoices" className="min-w-0 space-y-4 sm:space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">فواتير الصندوق</h3>
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
                className="w-auto self-end sm:self-auto"
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
              enabled={currentTab === 'invoices'}
            />
          </div>
        </TabsContent>}
        {hasCurrencies && <TabsContent value="returns" className="min-w-0 space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div>
            <h3 className="text-lg font-semibold">مرتجعات الصندوق</h3>
          </div>
            <Button size="sm" className="w-full sm:w-auto" onClick={() => { setSelectedReInvoice(null); setReInvoiceDialogOpen(true); }}>
              <Undo2 className="size-4" />إنشاء مرتجع</Button>
          </div>
          <ReInvoicesTable
            data={reInvoicesQuery.data?.data ?? []} loading={reInvoicesQuery.isLoading || deleteReInvoice.isPending}
            onView={(row) => {
              setSelectedReInvoice(row);
              setReInvoiceItemsId(row.id);
            }}
            onEdit={(row) => {
              setSelectedReInvoice(row);
              setReInvoiceDialogOpen(true);
            }}
            onDelete={async (row) => {
              await deleteReInvoice.mutateAsync(row.id);
            }} />
        </TabsContent>}

        {hasCurrencies && <TabsContent value="transfers" className="min-w-0 space-y-4 sm:space-y-5">
          {!canTransfer && (
            <div className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center">
              <AlertTriangle className="size-5 shrink-0 text-warning" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">رصيد الصندوق غير كافٍ لإجراء تحويل</p>
                <p className="mt-1 text-xs text-muted-foreground">أضف إيرادًا إلى الصندوق أولًا، وستبقى التحويلات السابقة ظاهرة أدناه.</p>
              </div>
              <Button type="button" size="sm" className="w-full sm:w-auto" onClick={() => { setSelectedRevenue(null); setRevenueDialogOpen(true); }}>
                <TrendingUp className="size-4" />
                إضافة إيراد
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-foreground">تحويلات الصندوق</h3>
            <Button
              disabled={!canTransfer}
              onClick={() => {
                setSelectedTransfer(null);
                setTransferDialogOpen(true);
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
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
        </TabsContent>}
      </Tabs>
      <ReInvoiceDialog open={reInvoiceDialogOpen} onClose={() => { setReInvoiceDialogOpen(false); setSelectedReInvoice(null); }} value={selectedReInvoice} currencies={fundCurrencies} modelType={modelType} loading={saveReInvoice.isPending} onSubmit={async (payload) => {
        const editingId = selectedReInvoice?.id;
        const saved = await saveReInvoice.mutateAsync({ id: editingId, payload });
        return saved;
      }} />
      <ReInvoiceItemsDialog id={reInvoiceItemsId} onClose={() => { setReInvoiceItemsId(undefined); setSelectedReInvoice(null); }} onEdit={selectedReInvoice ? () => { setReInvoiceItemsId(undefined); setReInvoiceDialogOpen(true); } : undefined} readOnly />

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
          fixedFundCurrencies={fundCurrencies}
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
