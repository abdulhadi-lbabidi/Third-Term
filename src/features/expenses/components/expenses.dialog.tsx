import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ExpensesForm } from './expenses.form';
import type { CreateExpensePayload, Expense } from '../types';

type ExpensesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Expense | null;
  fixedValues?: {
    source?: 'company_fund' | 'user_fund' | 'project_fund';
    project_id?: number;
    project_fund_id?: number;
    user_id?: number;
    user_fund_id?: number;
    company_fund_id?: number;
    fund_user_role?: string;
  };
  onSubmit: (data: CreateExpensePayload) => Promise<void>;
  loading?: boolean;
};

export function ExpensesDialog({ open, onOpenChange, defaultValues, fixedValues, onSubmit, loading }: ExpensesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'تعديل المصروف' : 'إضافة مصروف جديد'}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {open && (
            <ExpensesForm
              defaultValues={defaultValues}
              fixedValues={fixedValues}
              onSubmit={async (data) => {
                await onSubmit(data);
                onOpenChange(false);
              }}
              loading={loading}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
