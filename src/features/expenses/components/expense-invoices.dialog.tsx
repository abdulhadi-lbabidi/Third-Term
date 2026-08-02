import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { InvoicesTable } from '@/features/invoices/components/invoices.table';
import { InvoicesDialog } from '@/features/invoices/components/invoices.dialog';
import type { Expense } from '../types';

type ExpenseInvoicesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  fixedValues?: Record<string, any>;
};

export function ExpenseInvoicesDialog({
  open,
  onOpenChange,
  expense,
  fixedValues,
}: ExpenseInvoicesDialogProps) {
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  if (!open || !expense) return null;

  const combinedFixedValues = {
    ...fixedValues,
    expense_id: expense.id,
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between ml-4">
              <DialogTitle>فواتير المصروف: {expense.description}</DialogTitle>
              <Button onClick={() => setInvoiceDialogOpen(true)} size="sm">
                <PlusCircle className="mr-2 size-4" />
                إضافة فاتورة
              </Button>
            </div>
          </DialogHeader>
          <div className="py-4">
            <InvoicesTable 
              filters={{ 'filter[expense_id]': expense.id }}
              fixedValues={combinedFixedValues}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <InvoicesDialog
        isOpen={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        fixedValues={combinedFixedValues}
      />
    </>
  );
}
