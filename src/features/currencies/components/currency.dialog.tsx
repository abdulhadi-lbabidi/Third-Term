import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
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
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {currency
              ? t('currencies.dialog.editTitle', 'Edit Currency')
              : t('currencies.dialog.createTitle', 'Add New Currency')}
          </DialogTitle>
        </DialogHeader>
        <CurrencyForm
          defaultValues={currency || undefined}
          onSubmit={async (data) => {
            await onSubmit(data);
          }}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
