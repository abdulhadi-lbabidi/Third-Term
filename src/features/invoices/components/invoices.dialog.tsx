import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, ChevronLeft, FileText, PackageOpen, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { InvoiceItemForm } from '@/features/invoice-items/components/invoice-item.form';
import { invoiceItemsApi } from '@/features/invoice-items/invoice-items.api';
import { expensesApi } from '@/features/expenses/expenses.api';
import type { InvoiceItemFormValues } from '@/features/invoice-items/schemas/invoice-items.schema';
import type { InvoiceItem } from '@/features/invoice-items/types';
import type { Invoice } from '../types';
import { InvoicesForm } from './invoices.form';
import { useInvoice } from '../invoices.hooks';

type InvoicesDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: number;
  fixedValues?: Record<string, any>;
};

export function InvoicesDialog({ isOpen, onClose, invoiceId, fixedValues }: InvoicesDialogProps) {
  const closeAfterItemSaveRef = useRef(false);
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'invoice' | 'items'>('invoice');
  const [activeInvoiceId, setActiveInvoiceId] = useState<number | undefined>(invoiceId);
  const [createdInSession, setCreatedInSession] = useState(false);
  const [itemFormKey, setItemFormKey] = useState(0);
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('invoice');
    setActiveInvoiceId(invoiceId);
    setCreatedInSession(false);
    setItemFormKey(0);
    closeAfterItemSaveRef.current = false;
  }, [isOpen, invoiceId]);

  const isEdit = !!activeInvoiceId;
  const invoiceQuery = useInvoice(activeInvoiceId as number, isEdit && isOpen);
  const expenseId = Number(
    fixedValues?.expense_id ?? invoiceQuery.data?.expense_id ?? invoiceQuery.data?.expense?.id ?? 0,
  ) || undefined;
  const expenseQuery = useQuery({
    queryKey: ['expenses', 'detail', expenseId],
    queryFn: () => expensesApi.getExpenseById(expenseId!),
    enabled: isOpen && !!expenseId,
  });
  const currency = (expenseQuery.data?.expenseable_info as any)?.details?.currency;
  const currencyCode = currency?.currency ?? '';
  const currencyLabel = currency?.symbol ?? currencyCode;
  const priceStep = currencyCode === 'SYP' ? 100 : currencyCode === 'TRY' ? 20 : 1;
  const invoiceItemsQuery = useQuery({
    queryKey: ['invoice-items', 'invoice', activeInvoiceId],
    queryFn: () => invoiceItemsApi.getInvoiceItems(1, 100, { 'filter[invoice_id]': activeInvoiceId! }),
    enabled: isOpen && step === 'items' && !!activeInvoiceId,
  });
  const invoiceItems = (invoiceItemsQuery.data?.data ?? []).filter(
    (item) => item.invoice_id === activeInvoiceId || item.invoice?.id === activeInvoiceId,
  );

  const createItemMutation = useMutation({
    mutationFn: (values: InvoiceItemFormValues) => editingItem
      ? invoiceItemsApi.updateInvoiceItem(editingItem.id, values)
      : invoiceItemsApi.createInvoiceItem(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoice-items'] });
      setItemFormKey((value) => value + 1);
      toast.success(editingItem ? 'تم تحديث صنف الفاتورة بنجاح' : 'تمت إضافة صنف الفاتورة بنجاح');
      setEditingItem(null);
      if (closeAfterItemSaveRef.current) {
        closeAfterItemSaveRef.current = false;
        onClose();
      }
    },
    onError: () => {
      closeAfterItemSaveRef.current = false;
    },
  });
  const deleteItemMutation = useMutation({
    mutationFn: invoiceItemsApi.deleteInvoiceItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoice-items'] });
      toast.success('تم حذف صنف الفاتورة');
    },
  });

  const handleInvoiceSaved = (invoice?: Invoice) => {
    const savedId = invoice?.id ?? activeInvoiceId;
    if (!savedId) return;

    if (invoiceId && !createdInSession) {
      onClose();
      return;
    }

    setActiveInvoiceId(savedId);
    setCreatedInSession(true);
    setStep('items');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-h-[90vh] !overflow-y-auto !max-w-3xl ${step === 'items' ? '!max-w-3xl' : 'max-w-2xl'}`}>
        <DialogHeader>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-1">
            <button type="button" onClick={() => setStep('invoice')} className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm ${step === 'invoice' ? 'bg-background font-semibold text-primary shadow-sm' : 'text-muted-foreground'}`}>
              <FileText className="size-4" />بيانات الفاتورة
            </button>
            <button type="button" disabled={!activeInvoiceId} onClick={() => activeInvoiceId && setStep('items')} className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm disabled:opacity-40 ${step === 'items' ? 'bg-background font-semibold text-primary shadow-sm' : 'text-muted-foreground'}`}>
              <PackageOpen className="size-4" />الأصناف
            </button>
          </div>
          <DialogTitle>{step === 'items' ? 'إضافة أصناف الفاتورة' : isEdit ? 'تحديث الفاتورة' : 'إضافة فاتورة جديدة'}</DialogTitle>
          <DialogDescription>
            {step === 'items'
              ? 'أضف المواد والكميات والأسعار، ويمكنك الرجوع لتعديل بيانات الفاتورة.'
              : 'أدخل بيانات الفاتورة ثم انتقل لإضافة أصنافها.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-3">
          {step === 'invoice' ? (
            isEdit && invoiceQuery.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}
              </div>
            ) : (
              <InvoicesForm
                defaultValues={invoiceQuery.data}
                onSuccess={handleInvoiceSaved}
                onCancel={onClose}
                fixedValues={fixedValues}
              />
            )
          ) : activeInvoiceId ? (
            <div className="flex flex-col gap-3">
              {invoiceItems.length > 0 && (
                <div className="order-1 max-h-52 divide-y overflow-y-auto rounded-lg bg-muted/30 px-3">
                  {invoiceItems.map((item) => {
                    const total = Number(item.total_price ?? Number(item.quantity) * Number(item.unit_price));
                    return (
                      <details key={item.id} className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-2.5 [&::-webkit-details-marker]:hidden">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{item.material?.name ?? `مادة #${item.material_id}`}</p>
                            <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} × {Number(item.unit_price).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="finance-num font-semibold">{total.toLocaleString()} {currencyLabel}</span>
                            <ChevronLeft className="size-4 transition-transform group-open:-rotate-90" />
                          </div>
                        </summary>
                        <div className="flex items-end justify-between gap-3 pb-2.5">
                          <p className="text-sm text-muted-foreground">{item.item_description || 'بدون وصف'}</p>
                          <div className="flex gap-1">
                            <Button type="button" size="icon-sm" variant="ghost" onClick={() => { setEditingItem(item); setItemFormKey((value) => value + 1); }}><Pencil className="size-4" /></Button>
                            <Button type="button" size="icon-sm" variant="ghost" className="text-destructive" onClick={() => deleteItemMutation.mutate(item.id)}><Trash2 className="size-4" /></Button>
                          </div>
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
              <InvoiceItemForm
                key={itemFormKey}
                formId="invoice-item-dialog-form"
                fixedInvoiceId={activeInvoiceId}
                defaultValues={editingItem}
                currencyLabel={currencyLabel}
                priceStep={priceStep}
                onSubmit={async (values) => {
                  await createItemMutation.mutateAsync(values);
                }}
                onInvalid={() => {
                  closeAfterItemSaveRef.current = false;
                }}
                loading={createItemMutation.isPending}
              />
              <div className="order-2 flex items-center justify-between gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setStep('invoice')}>
                  <ArrowRight className="ml-2 size-4" />
                  تعديل بيانات الفاتورة
                </Button>
                <Button
                  type="submit"
                  form="invoice-item-dialog-form"
                  disabled={createItemMutation.isPending}
                  onClick={() => {
                    closeAfterItemSaveRef.current = true;
                  }}
                >
                  <CheckCircle2 className="ml-2 size-4" />
                  {createItemMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
