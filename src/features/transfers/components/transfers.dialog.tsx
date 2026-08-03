import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { TransfersForm } from './transfers.form';
import type { TransferableType, CreateTransferPayload, Transfer } from '../types';
import { useTransfer } from '../transfers.hooks';
import { Skeleton } from '@/shared/components/ui/skeleton';

type TransfersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  morph_from_type?: TransferableType;
  fixedFromCurrencies?: {
    id: number;
    expenseable_id?: number;
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
  const isEdit = !!defaultValues?.id;
  const { data: fullTransfer, isLoading } = useTransfer(defaultValues?.id, isEdit && open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl max-h-[90vh] overflow-visible">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'تعديل عملية التحويل' : 'إجراء عملية تحويل مالي'}</DialogTitle>
        </DialogHeader>
        <div className="py-3">
          {isEdit && isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-full mt-6" />
            </div>
          ) : open ? (
            <TransfersForm
              isGeneral={isGeneral}
              morph_from_type={morph_from_type}
              fixedFromCurrencies={fixedFromCurrencies}
              defaultValues={isEdit ? fullTransfer : defaultValues}
              onSubmit={async (data) => {
                await onSubmit(data);
                onOpenChange(false);
              }}
              loading={loading}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
