import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { InvoicesForm } from './invoices.form';
import { useInvoice } from '../invoices.hooks';
import { Skeleton } from '@/shared/components/ui/skeleton';

type InvoicesDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: number;
  fixedValues?: Record<string, any>;
};

export function InvoicesDialog({
  isOpen,
  onClose,
  invoiceId,
  fixedValues,
}: InvoicesDialogProps) {
  const isEdit = !!invoiceId;
  const { data: invoice, isLoading } = useInvoice(invoiceId as number, isEdit && isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'تحديث الفاتورة' : 'إضافة فاتورة جديدة'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'قم بتعديل بيانات الفاتورة المحددة أدناه.'
              : 'أدخل تفاصيل الفاتورة الجديدة واضغط على إضافة.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isEdit && isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <Skeleton className="h-10 w-full mt-6" />
            </div>
          ) : isOpen ? (
            <InvoicesForm
              defaultValues={invoice}
              onSuccess={onClose}
              fixedValues={fixedValues}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
