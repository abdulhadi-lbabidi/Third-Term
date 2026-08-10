import { useState } from 'react';
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
  fixedFundCurrencies?: {
    id: number;
    currency: string;
    symbol: string;
    balance: string;
  }[];
  onSubmit: (data: CreateExpensePayload) => Promise<void>;
  loading?: boolean;
};

export function ExpensesDialog({ open, onOpenChange, defaultValues, fixedValues, onSubmit, loading, fixedFundCurrencies }: ExpensesDialogProps) {
  const [formKey, setFormKey] = useState(0);

  return (
    <Dialog
      open={open}
      disablePointerDismissal
      onOpenChange={(nextOpen, details) => {
        if (!nextOpen) details.preventUnmountOnClose();
        if (details.reason === 'escape-key') return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent keepMounted className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'تعديل المصروف' : 'إضافة مصروف جديد'}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
            <ExpensesForm
              key={formKey}
              defaultValues={defaultValues}
              fixedValues={fixedValues}
              fixedFundCurrencies={fixedFundCurrencies}
              onSubmit={async (data) => {
                await onSubmit(data);
                setFormKey((value) => value + 1);
                onOpenChange(false);
              }}
              loading={loading}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
