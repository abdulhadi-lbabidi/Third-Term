import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { CurrencyForm } from './currency.form';
import type { Currency, CreateCurrencyPayload } from '../types';

type CurrencyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: Currency | null;
  onSubmit: (data: CreateCurrencyPayload) => Promise<void>;
  loading?: boolean;
};

export function CurrencyDialog({
  open,
  onOpenChange,
  currency,
  onSubmit,
  loading,
}: CurrencyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{currency ? 'تعديل عملة' : 'إضافة عملة جديدة'}</DialogTitle>
        </DialogHeader>
        {open && (
          <CurrencyForm
            defaultValues={currency || undefined}
            onSubmit={async (data) => {
              await onSubmit(data);
            }}
            loading={loading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
