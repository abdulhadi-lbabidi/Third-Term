import { useState, useMemo, useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/shared/lib/utils';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
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
import { getNextVoucherNumberFromRecords } from '@/shared/lib/voucher-number';
import { ExpensesTable } from '@/features/expenses/components/expenses.table';
import { ExpensesDialog } from '@/features/expenses/components/expenses.dialog';
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
import { getCurrencyStringFromInfo } from '@/features/components/table-helpers';
import { toast } from 'sonner';
import { fundsApi } from '@/features/funds/funds.api';
import { MoneyExchangeDialog } from './money-exchange.dialog';
import { SimplePagination } from '@/components/ui/pagination';

const statusLabels = {
  pending: { label: 'قيد العمل', className: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  complete: { label: 'مكتمل', className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  canceled: { label: 'منتهي', className: 'bg-rose-50 text-rose-700 border-rose-200/60' },
};

type GenericFundDetailsProps = {
  fundId: number;
  fundName: string;
  fundStatus?: 'pending' | 'complete' | 'canceled';
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
  type?: string;
  threshold?: number;
};

export function GenericFundDetails({
  fundId,
  fundName,
  fundStatus,
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
  type,
  threshold,
}: GenericFundDetailsProps) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();



  const currentTab = searchParams.get('fundTab') || 'transactions';
  const expenseFilterId = Number(searchParams.get('expenseId') || 0) || null;
  const hasCurrencies = fundCurrencies.length > 0;
  const canTransfer = fundCurrencies.some((currency) => Number(currency.balance) > 0);
  const tabsDragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const tabsDraggingRef = useRef(false);
  const tabsDragMovedRef = useRef(false);

  const userRole = (() => {
    try {
      const raw = localStorage.getItem('user_info');
      return raw ? JSON.parse(raw)?.role_type || null : null;
    } catch {
      return null;
    }
  })();

  const isCanceled = fundStatus === 'canceled';
  const isComplete = fundStatus === 'complete';
  const canEdit = !isComplete || userRole === 'admin';
  const canDelete = !isCanceled && (!isComplete || userRole === 'admin');
  const canAddTransaction = !isCanceled && (!isComplete || userRole === 'admin');

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
    }, { replace: true });
  };

  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<any | null>(null);

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [invoiceCreateOpen, setInvoiceCreateOpen] = useState(false);
  const [selectedExpenseForInvoiceCreate, setSelectedExpenseForInvoiceCreate] = useState<any | null>(null);

  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null);
  const [reInvoiceDialogOpen, setReInvoiceDialogOpen] = useState(false);
  const [selectedReInvoice, setSelectedReInvoice] = useState<ReInvoice | null>(null);
  const [reInvoiceItemsId, setReInvoiceItemsId] = useState<number>();
  const [moneyExchangeOpen, setMoneyExchangeOpen] = useState(false);

  const [transactionsPage, setTransactionsPage] = useState(1);
  const [revenuesPage, setRevenuesPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const [returnsPage, setReturnsPage] = useState(1);
  const [transfersPage, setTransfersPage] = useState(1);

  const exchangeMoneyMutation = useMutation({
    mutationFn: (payload: {
      exchangeable_type: string;
      exchangeable_id: number;
      from_currency: number;
      to_currency: number;
      amount: number;
      exchange_rate: number;
      operation: 'multiply' | 'divide';
    }) => fundsApi.exchangeMoney(payload),
    onSuccess: async () => {
      if (fundIdField === 'user_fund_id') {
        await queryClient.invalidateQueries({ queryKey: ['funds', 'detail', fundId] });
      } else if (fundIdField === 'project_fund_id') {
        await queryClient.invalidateQueries({ queryKey: ['project-funds', 'detail', fundId] });
      } else if (fundIdField === 'company_fund_id') {
        await queryClient.invalidateQueries({ queryKey: ['company-funds', fundId] });
      }
      toast.success('تم تصريف العملة بنجاح');
      setMoneyExchangeOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء تصريف العملة');
    },
  });

  const apiFilterField = fundIdField === 'user_fund_id' ? 'fund_id' : fundIdField;
  const filters = { [`filter[${apiFilterField}]`]: fundId };
  const reInvoicesQuery = useReInvoices({ paginate: true, per_page: 12, page: returnsPage, ...filters }, hasCurrencies);
  const saveReInvoice = useSaveReInvoice();
  const deleteReInvoice = useDeleteReInvoice();

  const revenuesQuery = useRevenues(revenuesPage, 12, filters, hasCurrencies);
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

  const expensesQuery = useExpenses(expensesPage, 12, filters, hasCurrencies);
  const fundExpenses = expensesQuery.data?.data ?? [];
  const isLoadingExpenses = expensesQuery.isLoading;
  const nextRevenueVoucherNumber = useMemo(
    () => getNextVoucherNumberFromRecords(fundRevenues),
    [fundRevenues],
  );
  const nextExpenseVoucherNumber = useMemo(
    () => getNextVoucherNumberFromRecords(fundExpenses, 'exp'),
    [fundExpenses],
  );
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
  }, hasCurrencies);
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
      const currency = fundCurrencies.find(c => Number(c.expenseable_id) === Number(data.expenseable_id) || Number(c.id) === Number(data.expenseable_id));
      if (currency && threshold !== undefined) {
        const newBalance = Number(currency.balance) - Number(data.amount);
        if (newBalance < Number(threshold)) {
          toast.error(`تنبيه: رصيد الصندوق "${fundName}" أصبح أقل من الحد الأدنى المسموح به (${Number(threshold).toLocaleString()} ${currency.symbol})! الرصيد الحالي المتوقع: ${newBalance.toLocaleString()} ${currency.symbol}`, {
            duration: 8000,
          });
        }
      }
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

  const transfersQuery = useTransfers(transfersPage, 12, transfersFilters, hasCurrencies);
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

  const isOutgoingTransfer = (transfer: any) => {
    if (fundIdField === 'company_fund_id') {
      return transfer.morph_from_info?.details?.company_fund_id === fundId;
    }
    if (fundIdField === 'project_fund_id') {
      return transfer.morph_from_info?.details?.project_fund_id === fundId;
    }
    return transfer.morph_from_info?.details?.fund_id === fundId;
  };

  const getTxCurrencySymbol = (tx: any, type: string) => {
    if (type === 'إيراد') {
      return getCurrencyStringFromInfo(tx.revenueable_info);
    }
    if (type === 'مصروف') {
      return getCurrencyStringFromInfo(tx.expenseable_info);
    }
    if (type === 'فاتورة') {
      return getCurrencyStringFromInfo(tx.expense?.expenseable_info);
    }
    if (type === 'مرتجع') {
      return getCurrencyStringFromInfo(tx.reinvoiceable_info);
    }
    if (type === 'تحويل وارد') {
      return tx.morph_to_info?.details?.currency?.symbol || tx.morph_to_info?.details?.currency?.currency || '';
    }
    if (type === 'تحويل صادر') {
      return tx.morph_from_info?.details?.currency?.symbol || tx.morph_from_info?.details?.currency?.currency || '';
    }
    return '';
  };

  const fundReInvoices = reInvoicesQuery.data?.data ?? [];
  const fundInvoices = fundInvoicesQuery.data?.data ?? [];

  const allTransactions = useMemo(() => {
    const list: Array<{
      id: number;
      type: 'إيراد' | 'مصروف' | 'فاتورة' | 'مرتجع' | 'تحويل وارد' | 'تحويل صادر';
      isIncoming: boolean;
      amount: number;
      statement: string;
      date: string;
      original: any;
    }> = [];

    for (const rev of fundRevenues) {
      list.push({
        id: rev.id,
        type: 'إيراد',
        isIncoming: true,
        amount: Number(rev.amount || 0),
        statement: rev.statement || rev.note || 'إيراد بدون بيان',
        date: rev.created_at || '',
        original: rev,
      });
    }

    for (const ret of fundReInvoices) {
      list.push({
        id: ret.id,
        type: 'مرتجع',
        isIncoming: true,
        amount: Number(ret.final_total || 0),
        statement: `فاتورة مرتجع #${ret.reinvoice_number || ret.id}`,
        date: ret.created_at || '',
        original: ret,
      });
    }

    for (const tr of fundTransfers) {
      const outgoing = isOutgoingTransfer(tr);
      list.push({
        id: tr.id,
        type: outgoing ? 'تحويل صادر' : 'تحويل وارد',
        isIncoming: !outgoing,
        amount: Number(tr.amount || 0),
        statement: tr.name || (outgoing ? `تحويل صادر #${tr.id}` : `تحويل وارد #${tr.id}`),
        date: tr.created_at || '',
        original: tr,
      });
    }

    for (const exp of fundExpenses) {
      list.push({
        id: exp.id,
        type: 'مصروف',
        isIncoming: false,
        amount: Number(exp.amount || 0),
        statement: exp.description || exp.note || 'مصروف بدون بيان',
        date: exp.created_at || '',
        original: exp,
      });
    }

    for (const inv of fundInvoices) {
      list.push({
        id: inv.id,
        type: 'فاتورة',
        isIncoming: false,
        amount: Number(inv.final_total || 0),
        statement: inv.expense_description || `فاتورة #${inv.invoice_number || inv.id}`,
        date: inv.created_at || '',
        original: inv,
      });
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [fundRevenues, fundReInvoices, fundTransfers, fundExpenses, fundInvoices, fundId, fundIdField]);

  const transactionsTotalPages = Math.ceil(allTransactions.length / 12) || 1;
  const safeTransactionsPage = Math.min(transactionsPage, transactionsTotalPages);
  const paginatedTransactions = useMemo(() => {
    const start = (safeTransactionsPage - 1) * 12;
    return allTransactions.slice(start, start + 12);
  }, [allTransactions, safeTransactionsPage]);

  const revenuesTotalPages = revenuesQuery.data?.meta?.last_page ?? (Math.ceil(fundRevenues.length / 12) || 1);
  const safeRevenuesPage = Math.min(revenuesPage, revenuesTotalPages);
  const paginatedRevenues = fundRevenues;

  const expensesTotalPages = expensesQuery.data?.meta?.last_page ?? (Math.ceil(fundExpenses.length / 12) || 1);
  const safeExpensesPage = Math.min(expensesPage, expensesTotalPages);
  const paginatedExpenses = fundExpenses;

  const returnsTotalPages = reInvoicesQuery.data?.meta?.last_page ?? (Math.ceil(fundReInvoices.length / 12) || 1);
  const safeReturnsPage = Math.min(returnsPage, returnsTotalPages);
  const paginatedReturns = fundReInvoices;

  const transfersTotalPages = transfersQuery.data?.meta?.last_page ?? (Math.ceil(fundTransfers.length / 12) || 1);
  const safeTransfersPage = Math.min(transfersPage, transfersTotalPages);
  const paginatedTransfers = fundTransfers;

  const isLoadingAll =
    revenuesQuery.isLoading ||
    expensesQuery.isLoading ||
    fundInvoicesQuery.isLoading ||
    transfersQuery.isLoading ||
    reInvoicesQuery.isLoading;

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
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{fundName}</h2>
                {type && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                    {type}
                  </span>
                )}
              </div>
              {extraDetails && <div>{extraDetails}</div>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {fundCurrencies.length > 0 ? (
                fundCurrencies.map((currency) => (
                  <div key={currency.id} className="flex min-w-0 max-w-full items-center gap-2 rounded-md bg-slate-100 px-3.5 py-1.5 text-base font-medium">
                    <span className={Number(currency.balance) > 0 ? 'text-lg font-bold text-success' : 'text-lg font-bold text-destructive'}>{Number(currency.balance || 0).toLocaleString()}</span>
                    <span className="text-sm text-slate-500">{currency.currency} {currency.symbol}</span>
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
            {fundStatus && (
              <span className={cn(
                "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold shrink-0",
                statusLabels[fundStatus]?.className
              )}>
                {statusLabels[fundStatus]?.label}
              </span>
            )}
            {canEdit && (
              <>
                {fundCurrencies.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger render={<Button type="button" variant="secondary" size="sm" onClick={() => setMoneyExchangeOpen(true)} aria-label="تصريف عملة" className="size-9 bg-slate-100 px-0 hover:bg-slate-200 sm:h-8 sm:w-auto sm:px-3" />}>
                      <ArrowLeftRight className="size-4 sm:ml-2" />
                      <span className="hidden sm:inline">تصريف عملة</span>
                    </TooltipTrigger>
                    <TooltipContent>تصريف عملة</TooltipContent>
                  </Tooltip>
                )}
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
              </>
            )}
            {canDelete && (
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
            )}
          </div>
        </TooltipProvider>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="min-w-0 w-full">
        <div
          dir="rtl"
          className="-mx-3 mb-0 cursor-grab touch-pan-x select-none overflow-x-auto px-3 pb-1 active:cursor-grabbing sm:mx-0 sm:mb-5 sm:px-0"
          onPointerDown={handleTabsPointerDown}
          onPointerMove={handleTabsPointerMove}
          onPointerUp={stopTabsDragging}
          onPointerCancel={stopTabsDragging}
          onPointerLeave={stopTabsDragging}
          onClickCapture={preventTabClickAfterDrag}
          onDragStart={(event) => event.preventDefault()}
        >
          <TabsList className="flex h-auto w-max min-w-full justify-start [&_[data-slot=tabs-trigger]]:h-9 [&_[data-slot=tabs-trigger]]:shrink-0">
            <TabsTrigger value="transactions" disabled={!hasCurrencies} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50/30 data-active:bg-purple-50 data-active:text-purple-700">
              <Banknote className="ml-2 size-4" />
              حركات الصندوق
            </TabsTrigger>
            <TabsTrigger value="revenues" disabled={!hasCurrencies} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/30 data-active:bg-emerald-50 data-active:text-emerald-700">
              <TrendingUp className="ml-2 size-4" />
              الإيرادات
            </TabsTrigger>
            <TabsTrigger value="expenses" disabled={!hasCurrencies} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50/30 data-active:bg-rose-50 data-active:text-rose-700">
              <ArrowDownToLine className="ml-2 size-4" />
              المصروفات
            </TabsTrigger>
            <TabsTrigger value="invoices" disabled={!hasCurrencies} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50/30 data-active:bg-amber-50 data-active:text-amber-700">
              <ReceiptText className="ml-2 size-4" />
              الفواتير
            </TabsTrigger>
            <TabsTrigger value="returns" disabled={!hasCurrencies} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50/30 data-active:bg-blue-50 data-active:text-blue-700"><Undo2 className="ml-2 size-4" />المرتجعات</TabsTrigger>
            <TabsTrigger value="transfers" disabled={!hasCurrencies} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50/30 data-active:bg-orange-50 data-active:text-orange-700">
              <ArrowLeftRight className="ml-2 size-4" />
              التحويلات
            </TabsTrigger>
          </TabsList>
        </div>

        {!hasCurrencies && <FundCurrencyEmptyState onAddCurrency={onAttachCurrency} showButton={canEdit} />}

        {hasCurrencies && (
          <>
            <TabsContent value="transactions" className="min-w-0 space-y-4 sm:space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* <h4 className="text-sm font-medium text-foreground">حركات الصندوق (كشف الحساب ذو الجانبين)</h4> */}
              </div>

              {isLoadingAll ? (
                <div className="flex flex-col gap-2 p-8 items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <span className="text-xs text-slate-500">جاري تحميل حركات الصندوق...</span>
                </div>
              ) : allTransactions.length === 0 ? (
                <div className="flex items-center justify-center border border-dashed rounded-lg p-12 text-sm text-slate-400 bg-slate-50">
                  لا توجد أي حركات مالية مسجلة في هذا الصندوق.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-center text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <th className="px-4 py-3 w-1/6 text-center">النوع</th>
                          <th className="px-4 py-3 w-2/6 text-center">البيان</th>
                          <th className="px-4 py-3 w-1/6 text-center">التاريخ</th>
                          <th className="px-4 py-3 w-1/6 text-center text-emerald-700 bg-emerald-50/30">وارد</th>
                          <th className="w-0 p-0 border-l border-slate-200"></th>
                          <th className="px-4 py-3 w-1/6 text-center text-rose-700 bg-rose-50/30">صادر</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedTransactions.map((tx, index) => {
                          const currency = getTxCurrencySymbol(tx.original, tx.type);
                          return (
                            <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3.5 text-center">
                                <span className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border",
                                  tx.isIncoming
                                    ? (tx.type === 'إيراد' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-sky-50 text-sky-700 border-sky-100")
                                    : (tx.type === 'مصروف' ? "bg-rose-50 text-rose-700 border-rose-100" : tx.type === 'فاتورة' ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-orange-50 text-orange-700 border-orange-100")
                                )}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center text-slate-600 max-w-[200px] truncate mx-auto" title={tx.statement}>
                                {tx.statement}
                              </td>
                              <td className="px-4 py-3.5 text-center text-slate-400">
                                {tx.date ? tx.date.slice(0, 10) : '-'}
                              </td>

                              <td className="px-4 py-3.5 text-center font-semibold text-emerald-600 bg-emerald-50/10 finance-num">
                                {tx.isIncoming ? `${tx.amount.toLocaleString()} ${currency}` : '-'}
                              </td>

                              <td className="w-0 p-0 border-l border-slate-200"></td>

                              <td className="px-4 py-3.5 text-center font-semibold text-rose-600 bg-rose-50/10 finance-num">
                                {!tx.isIncoming ? `${tx.amount.toLocaleString()} ${currency}` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <SimplePagination
                    currentPage={safeTransactionsPage}
                    totalPages={transactionsTotalPages}
                    onPageChange={setTransactionsPage}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="revenues" className="min-w-0 space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-sm font-medium text-foreground">جدول الإيرادات</h4>
            {canAddTransaction && (
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
            )}
          </div>

          <RevenuesTable
            data={paginatedRevenues}
            loading={isLoadingRevenues}
            hideTypeColumn={true}
            disableScroll={true}
            onEdit={canAddTransaction ? (revenue) => {
              setSelectedRevenue(revenue);
              setRevenueDialogOpen(true);
            } : undefined}
            onDelete={canAddTransaction ? async (revenue) => {
              await deleteRevenueMutation.mutateAsync(revenue.id);
            } : undefined}
          />
          <SimplePagination
            currentPage={safeRevenuesPage}
            totalPages={revenuesTotalPages}
            onPageChange={setRevenuesPage}
          />
        </TabsContent>
          </>
        )}

        {hasCurrencies && <TabsContent value="expenses" className="min-w-0 space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-foreground">مصروفات الصندوق</h3>
            {canAddTransaction && (
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
            )}
          </div>

          <ExpensesTable
            data={paginatedExpenses}
            loading={isLoadingExpenses}
            hideTypeColumn={true}
            disableScroll={true}
            onView={(expense) => {
              navigate(`/expenses/${expense.id}`);
            }}
            onEdit={canAddTransaction ? (expense) => {
              setSelectedExpense(expense);
              setExpenseDialogOpen(true);
            } : undefined}
            onDelete={canAddTransaction ? async (expense) => {
              await deleteExpenseMutation.mutateAsync(expense.id);
            } : undefined}
            onInvoices={(expense) => {
              setSearchParams((previous) => {
                previous.set('fundTab', 'invoices');
                previous.set('expenseId', String(expense.id));
                return previous;
              });
            }}
            onAddInvoice={canAddTransaction ? (expense) => {
              setSelectedExpenseForInvoiceCreate(expense);
              setInvoiceCreateOpen(true);
            } : undefined}
            invoiceCountsByExpenseId={invoiceCountsByExpenseId}
            invoicesLoading={fundInvoicesQuery.isLoading}
            invoicesError={fundInvoicesQuery.isError}
          />
          <SimplePagination
            currentPage={safeExpensesPage}
            totalPages={expensesTotalPages}
            onPageChange={setExpensesPage}
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
              perPage={12}
              disableScroll={true}
              enabled={currentTab === 'invoices'}
            />
          </div>
        </TabsContent>}
        {hasCurrencies && <TabsContent value="returns" className="min-w-0 space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div>
            <h3 className="text-lg font-semibold">مرتجعات الصندوق</h3>
          </div>
            {canAddTransaction && (
              <Button size="sm" className="w-full sm:w-auto" onClick={() => { setSelectedReInvoice(null); setReInvoiceDialogOpen(true); }}>
                <Undo2 className="size-4" />إنشاء مرتجع
              </Button>
            )}
          </div>
          <ReInvoicesTable
            data={paginatedReturns} loading={reInvoicesQuery.isLoading || deleteReInvoice.isPending}
            disableScroll={true}
            onView={(row) => {
              setSelectedReInvoice(row);
              setReInvoiceItemsId(row.id);
            }}
            onEdit={canAddTransaction ? (row) => {
              setSelectedReInvoice(row);
              setReInvoiceDialogOpen(true);
            } : undefined}
            onDelete={canAddTransaction ? async (row) => {
              await deleteReInvoice.mutateAsync(row.id);
            } : undefined} />
          <SimplePagination
            currentPage={safeReturnsPage}
            totalPages={returnsTotalPages}
            onPageChange={setReturnsPage}
          />
        </TabsContent>}

        {hasCurrencies && <TabsContent value="transfers" className="min-w-0 space-y-4 sm:space-y-5">
          {!canTransfer && (
            <div className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center">
              <AlertTriangle className="size-5 shrink-0 text-warning" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">رصيد الصندوق غير كافٍ لإجراء تحويل</p>
                <p className="mt-1 text-xs text-muted-foreground">أضف إيرادًا إلى الصندوق أولًا، وستبقى التحويلات السابقة ظاهرة أدناه.</p>
              </div>
              {canAddTransaction && (
                <Button type="button" size="sm" className="w-full sm:w-auto" onClick={() => { setSelectedRevenue(null); setRevenueDialogOpen(true); }}>
                  <TrendingUp className="size-4" />
                  إضافة إيراد
                </Button>
              )}
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-foreground">تحويلات الصندوق</h3>
            {canAddTransaction && (
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
            )}
          </div>

          <TransfersTable
            data={paginatedTransfers}
            loading={transfersQuery.isLoading}
            disableScroll={true}
            onEdit={canAddTransaction ? (transfer) => {
              setSelectedTransfer(transfer);
              setTransferDialogOpen(true);
            } : undefined}
            onDelete={canAddTransaction ? async (transfer) => {
              await deleteTransferMutation.mutateAsync(transfer.id);
            } : undefined}
            currentFund={{
              id: fundId,
              name: fundName,
              type: sourceType,
              currencies: fundCurrencies,
            }}
          />
          <SimplePagination
            currentPage={safeTransfersPage}
            totalPages={transfersTotalPages}
            onPageChange={setTransfersPage}
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
          nextVoucherNumber={nextRevenueVoucherNumber}
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
          nextVoucherNumber={nextExpenseVoucherNumber}
        />
      )}

      {invoiceCreateOpen && (
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
      )}


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
              const outgoingCurrency = fundCurrencies.find(c => Number(c.expenseable_id) === Number(data.morph_from_id) || Number(c.id) === Number(data.morph_from_id));
              const incomingCurrency = fundCurrencies.find(c => Number(c.expenseable_id) === Number(data.morph_to_id) || Number(c.id) === Number(data.morph_to_id));

              if (outgoingCurrency && threshold !== undefined) {
                const newBalance = Number(outgoingCurrency.balance) - Number(data.amount);
                if (newBalance < Number(threshold)) {
                  toast.error(`تنبيه: رصيد الصندوق "${fundName}" أصبح أقل من الحد الأدنى المسموح به (${Number(threshold).toLocaleString()} ${outgoingCurrency.symbol})! الرصيد الحالي المتوقع: ${newBalance.toLocaleString()} ${outgoingCurrency.symbol}`, {
                    duration: 8000,
                  });
                }
              } else if (incomingCurrency && threshold !== undefined) {
                const newBalance = Number(incomingCurrency.balance) + Number(data.amount);
                if (newBalance < Number(threshold)) {
                  toast.error(`تنبيه: رصيد الصندوق "${fundName}" أصبح أقل من الحد الأدنى المسموح به (${Number(threshold).toLocaleString()} ${incomingCurrency.symbol})! الرصيد الحالي المتوقع: ${newBalance.toLocaleString()} ${incomingCurrency.symbol}`, {
                    duration: 8000,
                  });
                }
              }
            }
          }}
          loading={createTransferMutation.isPending || updateTransferMutation.isPending}
        />
      )}

      {moneyExchangeOpen && (
        <MoneyExchangeDialog
          open={moneyExchangeOpen}
          onOpenChange={setMoneyExchangeOpen}
          fundCurrencies={fundCurrencies}
          loading={exchangeMoneyMutation.isPending}
          onSubmit={async (values) => {
            await exchangeMoneyMutation.mutateAsync({
              ...values,
              exchangeable_type: modelType.replace(/\\\\/g, '\\'),
            });
          }}
        />
      )}


    </div>
  );
}
