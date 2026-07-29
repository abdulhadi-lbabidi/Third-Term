import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';
import { InvoicesForm } from './invoices.form';
import type { Invoice, CreateInvoicePayload } from '../types';

type InvoicesDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice;
  fixedValues?: Partial<CreateInvoicePayload>;
};

export function InvoicesDialog({
  isOpen,
  onClose,
  invoice,
  fixedValues,
}: InvoicesDialogProps) {
  const isEdit = !!invoice;

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
          <InvoicesForm
            defaultValues={invoice}
            onSuccess={onClose}
            fixedValues={fixedValues}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
