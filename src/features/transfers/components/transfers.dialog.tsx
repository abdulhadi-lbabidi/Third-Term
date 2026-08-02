import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { TransfersForm } from './transfers.form';
import type { TransferableType, CreateTransferPayload, Transfer } from '../types';

type TransfersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  morph_from_type?: TransferableType;
  fixedFromCurrencies?: {
    id: number;
    currency: string;
    symbol: string;
    balance: string;
  }[];
  onSubmit: (data: CreateTransferPayload) => Promise<void>;
  loading?: boolean;
  defaultValues?: Transfer | null;
  isGeneral?: boolean;
};

export function TransfersDialog({
  open,
  onOpenChange,
  morph_from_type,
  fixedFromCurrencies = [],
  onSubmit,
  loading,
  defaultValues,
  isGeneral = false,
}: TransfersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl max-h-[90vh] overflow-visible">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'تعديل عملية التحويل' : 'إجراء عملية تحويل مالي'}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {open && (
            <TransfersForm
              isGeneral={isGeneral}
              morph_from_type={morph_from_type}
              fixedFromCurrencies={fixedFromCurrencies}
              defaultValues={defaultValues}
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
