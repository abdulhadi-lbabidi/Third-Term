import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ExpensesForm } from './expenses.form';
import { InvoicesDialog } from '@/features/invoices/components/invoices.dialog';
import { FileText, PackageOpen, ReceiptText } from 'lucide-react';
import { expensesApi } from '../expenses.api';
import { Skeleton } from '@/shared/components/ui/skeleton';
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
  onSubmit: (data: CreateExpensePayload) => Promise<Expense | void>;
  loading?: boolean;
};

export function ExpensesDialog({ open, onOpenChange, defaultValues, fixedValues, onSubmit, loading, fixedFundCurrencies }: ExpensesDialogProps) {
  const [formKey, setFormKey] = useState(0);
  const [step, setStep] = useState<'expense' | 'invoice'>('expense');
  const [createdExpenseId, setCreatedExpenseId] = useState<number | null>(null);

  const { data: fetchedExpense, isLoading: isFetchingExpense } = useQuery({
    queryKey: ['expenses', 'detail', defaultValues?.id] as const,
    queryFn: () => expensesApi.getExpenseById(defaultValues!.id),
    enabled: open && Boolean(defaultValues?.id),
  });

  const resetWorkflow = () => {
    setFormKey((value) => value + 1);
    setStep('expense');
    setCreatedExpenseId(null);
  };

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
      <DialogContent keepMounted className="max-h-[calc(100dvh-1rem)] !max-w-5xl !overflow-x-hidden !overflow-y-auto overscroll-contain sm:max-h-[90dvh]">
        {step === 'expense' && <DialogHeader>
          {!defaultValues && (
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-1">
              <div className={`flex items-center justify-center gap-2 rounded-md px-2 py-2 text-sm ${step === 'expense' ? 'bg-background font-semibold text-primary shadow-sm' : 'text-muted-foreground'}`}>
                <ReceiptText className="size-4" />المصروف
              </div>
              <div className="flex items-center justify-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground">
                <FileText className="size-4" />الفاتورة
              </div>
              <div className="flex items-center justify-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground">
                <PackageOpen className="size-4" />عناصر الفاتورة
              </div>
            </div>
          )}
          <DialogTitle>{defaultValues ? 'تعديل المصروف' : 'إضافة مصروف جديد'}</DialogTitle>
        </DialogHeader>}
        <div className="py-4">
          {step === 'expense' ? (
            isFetchingExpense ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <ExpensesForm
                key={formKey}
                defaultValues={fetchedExpense || defaultValues}
                fixedValues={fixedValues}
                fixedFundCurrencies={fixedFundCurrencies}
                onSubmit={async (data) => {
                  await onSubmit(data);
                  resetWorkflow();
                  onOpenChange(false);
                }}
                onSubmitWithInvoice={!defaultValues ? async (data) => {
                  const expense = await onSubmit(data);
                  if (!expense?.id) return;
                  setCreatedExpenseId(expense.id);
                  setStep('invoice');
                } : undefined}
                loading={loading}
              />
            )
          ) : createdExpenseId ? (
            <InvoicesDialog
              isOpen={open}
              embedded
              showExpenseStep
              fixedValues={{ expense_id: createdExpenseId }}
              onCompleted={() => {
                resetWorkflow();
                onOpenChange(false);
              }}
              onClose={() => undefined}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
