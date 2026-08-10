import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { InvoiceItemForm } from './invoice-item.form';
import type { InvoiceItemFormValues } from '../schemas/invoice-items.schema';
import type { InvoiceItem } from '../types';

type InvoiceItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceItem?: InvoiceItem | null;
  fixedInvoiceId?: number;
  onSubmit: (data: InvoiceItemFormValues) => Promise<void>;
  loading?: boolean;
};

export function InvoiceItemDialog({
  open,
  onOpenChange,
  invoiceItem,
  fixedInvoiceId,
  onSubmit,
  loading,
}: InvoiceItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-2xl">
        <DialogHeader>
          <DialogTitle>{invoiceItem ? 'تعديل صنف فاتورة' : 'إضافة صنف فاتورة'}</DialogTitle>
        </DialogHeader>
          <InvoiceItemForm
            defaultValues={invoiceItem}
            fixedInvoiceId={fixedInvoiceId}
            onSubmit={onSubmit}
            loading={loading}
          />
      </DialogContent>
    </Dialog>
  );
}
