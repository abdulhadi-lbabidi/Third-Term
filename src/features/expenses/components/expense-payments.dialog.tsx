import { useMemo } from 'react';
import {
  CreditCard,
  Calendar,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { cn, formatArabicDate } from '@/shared/lib/utils';
import { getCurrencyStringFromInfo } from '@/features/components/table-helpers';
import type { Expense } from '../types';

type ExpensePaymentItem = {
  id: number;
  paid_amount: number;
  remaining_amount: number;
  payment_date: string;
};

type ExpensePaymentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
};

function getRemainingColor(amount: number) {
  if (amount > 0) return 'text-red-600 dark:text-red-400';
  if (amount === 0) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-amber-500 dark:text-amber-400';
}

export function ExpensePaymentsDialog({
  open,
  onOpenChange,
  expense,
}: ExpensePaymentsDialogProps) {
  const currency = useMemo(() => {
    if (!expense) return '';
    return getCurrencyStringFromInfo(expense.expenseable_info) || 'ر.س';
  }, [expense]);

  const totalAmount = useMemo(() => {
    return Number(expense?.amount || 0);
  }, [expense]);

  const mockPayments = useMemo<ExpensePaymentItem[]>(() => {
    if (!expense) return [];
    const base = totalAmount > 0 ? totalAmount : 150000;
    const firstPayment = Math.round(base * 0.4);
    const secondPayment = Math.round(base * 0.35);
    const thirdPayment = base - firstPayment - secondPayment;

    return [
      {
        id: 1,
        paid_amount: firstPayment,
        remaining_amount: base - firstPayment,
        payment_date: '2026-09-01',
      },
      {
        id: 2,
        paid_amount: secondPayment,
        remaining_amount: base - firstPayment - secondPayment,
        payment_date: '2026-09-07',
      },
      {
        id: 3,
        paid_amount: thirdPayment,
        remaining_amount: 0,
        payment_date: '2026-09-12',
      },
    ];
  }, [expense, totalAmount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CreditCard className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">الدفعات</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {expense?.description ? `سجل دفعات المصروف: ${expense.description}` : 'سجل الدفعات'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-hidden rounded-lg border border-border/80 mt-2">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="text-center !text-center font-semibold">#</TableHead>
                <TableHead className="text-center !text-center font-semibold">المبلغ المدفوع</TableHead>
                <TableHead className="text-center !text-center font-semibold">المبلغ المتبقي</TableHead>
                <TableHead className="text-center !text-center font-semibold">تاريخ الدفع</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPayments.map((payment, index) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-center !text-center font-medium text-muted-foreground">
                    <div className="flex items-center justify-center">
                      <span>{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center !text-center">
                    <div className="flex items-center justify-center">
                      <span className="finance-num font-semibold text-emerald-600 dark:text-emerald-400">
                        {payment.paid_amount.toLocaleString()} {currency}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center !text-center">
                    <div className="flex items-center justify-center">
                      <span className={cn('finance-num font-semibold', getRemainingColor(payment.remaining_amount))}>
                        {payment.remaining_amount.toLocaleString()} {currency}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center !text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span>{formatArabicDate(payment.payment_date)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
