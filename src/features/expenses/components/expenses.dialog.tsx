import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ExpensesForm } from './expenses.form';
import type { CreateExpensePayload, Expense } from '../types';

type ExpensesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  onSubmit: (data: CreateExpensePayload) => Promise<void>;
  loading?: boolean;
};

export function ExpensesDialog({ open, onOpenChange, expense, onSubmit, loading }: ExpensesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-visible rounded-2xl">
        <DialogHeader>
          <DialogTitle>{expense ? 'تعديل مصروف' : 'إضافة مصروف'}</DialogTitle>
        </DialogHeader>

        <ExpensesForm defaultValues={expense} onSubmit={onSubmit} loading={loading} />
      </DialogContent>
    </Dialog>
  );
}
