import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { PlusCircle, Receipt, Loader2 } from 'lucide-react';
import { InvoicesTable } from '@/features/invoices/components/invoices.table';
import { InvoicesDialog } from '@/features/invoices/components/invoices.dialog';
import { useInvoices } from '@/features/invoices/invoices.hooks';
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

  const { data, isLoading } = useInvoices(
    { 'filter[expense_id]': expense?.id },
    open && !!expense?.id
  );
  
  const invoices = data?.data ?? (Array.isArray(data) ? data : []);
  const hasInvoices = invoices.length > 0;

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
              {hasInvoices && (
                <Button onClick={() => setInvoiceDialogOpen(true)} size="sm">
                  <PlusCircle className="mr-2 size-4" />
                  إضافة فاتورة
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="py-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="size-8 animate-spin text-slate-300" />
              </div>
            ) : hasInvoices ? (
              <InvoicesTable 
                filters={{ 'filter[expense_id]': expense.id }}
                fixedValues={combinedFixedValues}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="size-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
                  <Receipt className="size-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">لا توجد فواتير</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-sm">
                  لم يتم إضافة أي فواتير لهذا المصروف بعد. يمكنك إضافة فاتورة جديدة لتتبع نفقات هذا المصروف.
                </p>
                <Button onClick={() => setInvoiceDialogOpen(true)}>
                  <PlusCircle className="mr-2 size-4" />
                  إضافة فاتورة جديدة
                </Button>
              </div>
            )}
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
