import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { TransfersForm } from './transfers.form';
import type { TransferableType, CreateTransferPayload } from '../types';

type TransfersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  morph_from_type: TransferableType;
  fixedFromCurrencies: {
    id: number;
    currency: string;
    symbol: string;
    balance: string;
  }[];
  onSubmit: (data: CreateTransferPayload) => Promise<void>;
  loading?: boolean;
};

export function TransfersDialog({
  open,
  onOpenChange,
  morph_from_type,
  fixedFromCurrencies,
  onSubmit,
  loading,
}: TransfersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إجراء عملية تحويل مالي</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {open && (
            <TransfersForm
              morph_from_type={morph_from_type}
              fixedFromCurrencies={fixedFromCurrencies}
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
