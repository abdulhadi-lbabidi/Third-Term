import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import { format } from 'date-fns';
import { useInvoice } from '../invoices.hooks';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronLeft, PackageOpen, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { invoiceItemsApi } from '@/features/invoice-items/invoice-items.api';
import { expensesApi } from '@/features/expenses/expenses.api';
import { InvoiceItemDialog } from '@/features/invoice-items/components/invoice-item.dialog';
import type { InvoiceItemFormValues } from '@/features/invoice-items/schemas/invoice-items.schema';
import { Button } from '@/shared/components/ui/button';

type InvoiceDetailsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number | null;
};

export function InvoiceDetailsDialog({ isOpen, onClose, invoiceId }: InvoiceDetailsDialogProps) {
  const queryClient = useQueryClient();
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const { data: invoice, isLoading } = useInvoice(invoiceId as number, !!invoiceId);
  const expenseId = invoice?.expense_id ?? invoice?.expense?.id;
  const expenseQuery = useQuery({
    queryKey: ['expenses', 'detail', expenseId],
    queryFn: () => expensesApi.getExpenseById(expenseId!),
    enabled: isOpen && !!expenseId,
  });
  const expenseCurrency = (expenseQuery.data?.expenseable_info as any)?.details?.currency;
  const currencyLabel = expenseCurrency?.symbol ?? expenseCurrency?.currency ?? '';
  const invoiceItemsQuery = useQuery({
    queryKey: ['invoice-items', 'invoice', invoiceId],
    queryFn: () => invoiceItemsApi.getInvoiceItems(1, 100, { 'filter[invoice_id]': invoiceId! }),
    enabled: isOpen && !!invoiceId,
  });
  const invoiceItems = (invoiceItemsQuery.data?.data ?? []).filter(
    (item) => item.invoice_id === invoiceId || item.invoice?.id === invoiceId,
  );
  const itemsTotal = invoiceItems.reduce(
    (sum, item) => sum + Number(item.total_price ?? Number(item.quantity) * Number(item.unit_price)),
    0,
  );
  const createItemMutation = useMutation({
    mutationFn: (values: InvoiceItemFormValues) => invoiceItemsApi.createInvoiceItem(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoice-items'] });
      setItemDialogOpen(false);
      toast.success('تمت إضافة صنف الفاتورة بنجاح');
    },
  });

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] w-[min(94vw,1100px)] max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isLoading ? <Skeleton className="h-7 w-64" /> : `تفاصيل الفاتورة - ${invoice?.invoice_number || `#${invoice?.id}`}`}
            </DialogTitle>
          </DialogHeader>

          {isLoading || !invoice ? (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-full max-w-[200px]" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <span className="text-sm text-slate-500">النفقة المرتبطة:</span>
                  <p className="mr-1 inline font-medium text-slate-900">
                    {invoice.expense_description || invoice.expense?.description || '-'}
                  </p>
                </div>

                <div>
                  <span className="text-sm text-slate-500">مرئية للعميل:</span>
                  <p className="mr-1 inline font-medium text-slate-900">{invoice.is_visible_to_client ? 'نعم' : 'لا'}</p>
                </div>
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm text-slate-500">الخصم:</span>
                  <p className="mr-1 inline font-medium text-slate-900">{Number(invoice.discount || 0).toLocaleString()} {currencyLabel}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">الإجمالي النهائي:</span>
                  <p className="mr-1 inline text-lg font-bold text-emerald-600">{Number(invoice.final_total || 0).toLocaleString()} {currencyLabel}</p>
                </div>
              </div>

              <section className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">أصناف الفاتورة</h3>
                    <p className="text-xs text-slate-500">المواد والكميات والأسعار المرتبطة بهذه الفاتورة</p>
                  </div>
                  {invoiceItems.length > 0 && (
                    <div className="flex items-center gap-2">
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
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 [&::-webkit-details-marker]:hidden">
                              <div className="min-w-0">
                                <p className="truncate font-medium">{item.material?.name ?? `مادة #${item.material_id}`}</p>
                                <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} × {Number(item.unit_price).toLocaleString()} {currencyLabel}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="finance-num font-semibold">{total.toLocaleString()} {currencyLabel}</span>
                                <ChevronLeft className="size-4 transition-transform group-open:-rotate-90" />
                              </div>
                            </summary>
                            <p className="pb-3 text-sm text-muted-foreground">{item.item_description || 'بدون وصف'}</p>
                          </details>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-sm">
                      <span>مجموع الأصناف قبل الخصم</span>
                      <span className="finance-num font-bold">{itemsTotal.toLocaleString()} {currencyLabel}</span>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <InvoiceItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        fixedInvoiceId={invoiceId ?? undefined}
        onSubmit={async (values) => {
          await createItemMutation.mutateAsync(values);
        }}
        loading={createItemMutation.isPending}
      />
    </>
  );
}
