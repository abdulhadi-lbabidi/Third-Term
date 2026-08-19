import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  ChevronLeft,
  PackageOpen,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { PageHeader } from '../components/page-header';
import { invoicesApi } from './invoices.api';
import { expensesApi } from '@/features/expenses/expenses.api';
import { invoiceItemsApi } from '@/features/invoice-items/invoice-items.api';
import { InvoiceItemDialog } from '@/features/invoice-items/components/invoice-item.dialog';
import type { InvoiceItemFormValues } from '@/features/invoice-items/schemas/invoice-items.schema';
import { ReInvoiceDialog } from '@/features/re-invoices/components/re-invoice.dialog';
import { useSaveReInvoice } from '@/features/re-invoices/re-invoices.hooks';
import { toast } from 'sonner';
import { format } from 'date-fns';

function getReinvoiceableType(type?: string) {
  if (!type) return 'App\\Models\\ProjectFundCurrency';
  if (type.includes('CompanyFundCurrency') || type === 'company_fund') return 'App\\Models\\CompanyFundCurrency';
  if (type.includes('CurrencyFund') || type === 'currency_fund' || type === 'user_fund') return 'App\\Models\\CurrencyFund';
  return 'App\\Models\\ProjectFundCurrency';
}

export function InvoiceDetailsPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const id = Number(invoiceId);
  const queryClient = useQueryClient();
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [reInvoiceDialogOpen, setReInvoiceDialogOpen] = useState(false);
  const saveReInvoice = useSaveReInvoice();

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['invoices', 'detail', id],
    queryFn: () => invoicesApi.getInvoice(id),
    enabled: !!id,
  });

  const expenseId = invoice?.expense_id ?? invoice?.expense?.id;

  const expenseQuery = useQuery({
    queryKey: ['expenses', 'detail', expenseId],
    queryFn: () => expensesApi.getExpenseById(expenseId!),
    enabled: !!expenseId,
  });

  const expenseCurrency = (expenseQuery.data?.expenseable_info as any)?.details?.currency;
  const currencyLabel = expenseCurrency?.symbol ?? expenseCurrency?.currency ?? '';

  const invoiceItemsParams = useMemo(() => ({ 'filter[invoice_id]': id }), [id]);
  const invoiceItemsQuery = useQuery({
    queryKey: ['invoice-items', 'invoice', id],
    queryFn: () => invoiceItemsApi.getInvoiceItems(1, 100, invoiceItemsParams),
    enabled: !!id,
  });

  const invoiceItems = (invoiceItemsQuery.data?.data ?? []).filter(
    (item) => item.invoice_id === id || item.invoice?.id === id,
  );

  const itemsTotal = invoiceItems.reduce(
    (sum, item) => sum + Number(item.total_price ?? Number(item.quantity) * Number(item.unit_price)),
    0,
  );

  const rawItemId = invoice?.item_id ?? (typeof invoice?.item === 'object' ? invoice?.item?.id : 0);
  const rawSupplierId = invoice?.supplier_id ?? (typeof invoice?.supplier === 'object' ? invoice?.supplier?.id : undefined);
  const reinvoiceableType = getReinvoiceableType(expenseQuery.data?.expenseable_type ?? expenseQuery.data?.expenseable_info?.type);
  const reinvoiceableId = expenseQuery.data?.expenseable_id ?? (expenseQuery.data?.expenseable_info?.details as any)?.id ?? 0;

  const prefilledReInvoiceValue = useMemo(() => {
    if (!invoice) return null;
    return {
      item_id: Number(rawItemId),
      supplier_id: rawSupplierId ? Number(rawSupplierId) : undefined,
      reinvoiceable_type: reinvoiceableType,
      reinvoiceable_id: Number(reinvoiceableId),
      date: invoice.date ? invoice.date.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
      discount: Number(invoice.discount ?? 0),
      final_total: Number(invoice.final_total ?? 0),
      is_posted: false,
      is_visible_to_client: invoice.is_visible_to_client ?? true,
    };
  }, [invoice, rawItemId, rawSupplierId, reinvoiceableType, reinvoiceableId]);

  const expenseDetails = (expenseQuery.data?.expenseable_info as any)?.details;
  const reInvoiceCurrencies = useMemo(() => {
    if (!reinvoiceableId) return [];
    return [{
      id: Number(reinvoiceableId),
      expenseable_id: Number(reinvoiceableId),
      currency: expenseCurrency?.currency ?? '',
      symbol: expenseCurrency?.symbol ?? '',
      balance: String(expenseDetails?.balance ?? 0),
    }];
  }, [reinvoiceableId, expenseCurrency, expenseDetails?.balance]);

  const createItemMutation = useMutation({
    mutationFn: (values: InvoiceItemFormValues) => invoiceItemsApi.createInvoiceItem(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoice-items'] });
      setItemDialogOpen(false);
      toast.success('تمت إضافة صنف الفاتورة بنجاح');
    },
  });

  return (
    <div className="flex flex-col flex-1 space-y-4 font-sans" dir="rtl">
      <PageHeader
        badge="الفواتير"
        title={isLoading ? 'تفاصيل الفاتورة' : `تفاصيل الفاتورة - ${invoice?.invoice_number || `#${invoice?.id}`}`}
        icon={FileText}
        action={
          invoice ? (
            <Button type="button" onClick={() => setReInvoiceDialogOpen(true)}>
              <RotateCcw className="ml-2 size-4" />
              عمل مرتجع
            </Button>
          ) : undefined
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full max-w-[200px]" />
                </div>
              ))}
            </div>
          </div>
        ) : isError || !invoice ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive font-semibold">
            تعذر تحميل تفاصيل الفاتورة
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-card shadow-finance p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm text-slate-500">التاريخ:</span>
                  <p className="mr-1 inline font-medium text-slate-900">
                    {invoice.date ? format(new Date(invoice.date), 'yyyy-MM-dd') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">تاريخ الإنشاء:</span>
                  <p className="mr-1 inline font-medium text-slate-900">
                    {invoice.created_at ? format(new Date(invoice.created_at), 'yyyy-MM-dd') : '-'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-slate-500">الحالة:</span>
                  <div>
                    <Badge variant={invoice.is_posted ? 'default' : 'secondary'} className={invoice.is_posted ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}>
                      {invoice.is_posted ? 'مرحل' : 'غير مرحل'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-slate-500">المورد:</span>
                  <p className="mr-1 inline font-medium text-slate-900">
                    {typeof invoice.supplier === 'string' ? invoice.supplier : invoice.supplier?.name || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">المادة (البند):</span>
                  <p className="mr-1 inline font-medium text-slate-900">
                    {typeof invoice.item === 'string' ? invoice.item : invoice.item?.name || '-'}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-slate-500">النفقة المرتبطة (بنود مصروف):</span>
                  <p className="mr-1 inline font-medium text-slate-900">
                    {invoice.expense_description || invoice.expense?.description || '-'}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-slate-500">مرئية للعميل:</span>
                  <p className="mr-1 inline font-medium text-slate-900">{invoice.is_visible_to_client ? 'نعم' : 'لا'}</p>
                </div>
              </div>

              {expenseQuery.data && (
                <div className="border-t pt-4 mt-2">
                  <h4 className="text-xs font-semibold text-primary mb-2">تفاصيل المصروف المرتبط:</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 bg-muted/30 rounded-lg p-3">
                    <div>
                      <span className="text-xs text-slate-500">البيان:</span>
                      <p className="text-xs font-medium text-foreground">{expenseQuery.data.description}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">مبلغ المصروف:</span>
                      <p className="text-xs font-medium text-foreground finance-num">{Number(expenseQuery.data.amount || 0).toLocaleString()} {currencyLabel}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">حالة الترحيل:</span>
                      <p className="text-xs font-medium">
                        <span className={expenseQuery.data.is_posted ? 'status-badge-success' : 'status-badge-danger'}>
                          {expenseQuery.data.is_posted ? 'مرحّل' : 'غير مرحّل'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 rounded-lg border bg-slate-50 p-4 pt-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm text-slate-500">الحسم:</span>
                  <p className="mr-1 inline font-medium text-slate-900">{Number(invoice.discount || 0).toLocaleString()} {currencyLabel}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">الإجمالي النهائي:</span>
                  <p className="mr-1 inline text-lg font-bold text-emerald-600">{Number(invoice.final_total || 0).toLocaleString()} {currencyLabel}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card shadow-finance p-4">
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">أصناف الفاتورة</h3>
                    <p className="text-xs text-slate-500">المواد والكميات والأسعار المرتبطة بهذه الفاتورة</p>
                  </div>
                  {invoiceItems.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{invoiceItems.length} صنف</Badge>
                      <Button type="button" size="sm" onClick={() => setItemDialogOpen(true)}>
                        <PlusCircle className="ml-2 size-4" />
                        إضافة صنف
                      </Button>
                    </div>
                  )}
                  {invoiceItems.length === 0 && !invoiceItemsQuery.isLoading && (
                    <Button type="button" size="sm" onClick={() => setItemDialogOpen(true)}>
                      <PlusCircle className="ml-2 size-4" />
                      إضافة صنف
                    </Button>
                  )}
                </div>

                {invoiceItemsQuery.isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-11 w-full" />
                    ))}
                  </div>
                ) : invoiceItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                    <PackageOpen className="mb-2 size-7 text-slate-400" />
                    <p className="text-sm font-medium text-slate-600">لا توجد أصناف مرتبطة بهذه الفاتورة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid gap-2 sm:grid-cols-1">
                      {invoiceItems.map((item) => {
                        const total = Number(item.total_price ?? Number(item.quantity) * Number(item.unit_price));
                        return (
                          <details key={item.id} className="group rounded-lg bg-muted/40 px-3">
                            <summary className="flex cursor-pointer list-none flex-col items-start gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 [&::-webkit-details-marker]:hidden">
                              <div className="min-w-0">
                                <p className="truncate font-medium">{item.material?.name ?? `مادة #${item.material_id}`}</p>
                                <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} × {Number(item.unit_price).toLocaleString()} {currencyLabel}</p>
                              </div>
                              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                                <span className="finance-num font-semibold">{total.toLocaleString()} {currencyLabel}</span>
                                <ChevronLeft className="size-4 transition-transform group-open:-rotate-90" />
                              </div>
                            </summary>
                            <p className="pb-3 text-sm text-muted-foreground">{item.item_description || 'بدون وصف'}</p>
                          </details>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm">
                      <span>مجموع الأصناف قبل الحسم</span>
                      <span className="finance-num font-bold">{itemsTotal.toLocaleString()} {currencyLabel}</span>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      <InvoiceItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        fixedInvoiceId={id ?? undefined}
        onSubmit={async (values) => {
          await createItemMutation.mutateAsync(values);
        }}
        loading={createItemMutation.isPending}
      />

      <ReInvoiceDialog
        open={reInvoiceDialogOpen}
        onClose={() => setReInvoiceDialogOpen(false)}
        value={prefilledReInvoiceValue}
        currencies={reInvoiceCurrencies}
        modelType={reinvoiceableType}
        loading={saveReInvoice.isPending}
        sourceInvoiceItems={invoiceItems}
        disablePrefilledFields={true}
        onSubmit={async (payload) => {
          const saved = await saveReInvoice.mutateAsync({ payload });
          return saved;
        }}
      />
    </div>
  );
}
