import { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import {
  HandCoins,
  CheckCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';

type SettleInvoicePaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any | null;
  currency?: string;
};

export function SettleInvoicePaymentDialog({
  open,
  onOpenChange,
  invoice,
  currency = '',
}: SettleInvoicePaymentDialogProps) {
  const [paidAmount, setPaidAmount] = useState('');
  const [deliveredTo, setDeliveredTo] = useState('');

  useEffect(() => {
    if (open) {
      setPaidAmount('');
      setDeliveredTo('');
    }
  }, [open]);

  const totalAmount = useMemo(() => {
    return Number(invoice?.final_total || 0);
  }, [invoice]);

  const remainingAmount = useMemo(() => {
    if (totalAmount <= 0) return 0;
    return Math.round(totalAmount * 0.4);
  }, [totalAmount]);

  const handleCompleteAmount = () => {
    setPaidAmount(remainingAmount.toLocaleString('en-US'));
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
      if (rawValue === '') {
        setPaidAmount('');
      } else {
        const parts = rawValue.split('.');
        parts[0] = Number(parts[0]).toLocaleString('en-US');
        setPaidAmount(parts.join('.'));
      }
    }
  };

  const handleSubmit = () => {
    toast.success('تم تسديد الدفعة بنجاح');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HandCoins className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">تسديد الدفعة</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {invoice?.invoice_number ? `تسديد دفعة للفاتورة #${invoice.invoice_number}` : 'تسديد دفعة الفاتورة'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">المبلغ المتبقي:</span>
              <span className="finance-num text-base font-bold text-red-600 dark:text-red-400">
                {remainingAmount.toLocaleString()} {currency}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCompleteAmount}
              className="gap-1.5 text-xs"
            >
              <CheckCheck className="size-3.5" />
              إكمال المبلغ
            </Button>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settle-invoice-paid-amount" className="text-sm font-medium">
              المبلغ المدفوع
            </label>
            <div className="relative">
              <Input
                id="settle-invoice-paid-amount"
                type="text"
                value={paidAmount}
                onChange={handleAmountChange}
                placeholder="أدخل المبلغ المدفوع"
                className="pe-12 text-start"
              />
              {currency ? (
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-xs text-muted-foreground">
                  {currency}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settle-invoice-delivered-to" className="text-sm font-medium">
              المسلَّم بيد
            </label>
            <Input
              id="settle-invoice-delivered-to"
              type="text"
              value={deliveredTo}
              onChange={(e) => setDeliveredTo(e.target.value)}
              placeholder="أدخل اسم المسلَّم بيد"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!paidAmount || Number(paidAmount.replace(/,/g, '')) <= 0}
          >
            تسديد الدفعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
