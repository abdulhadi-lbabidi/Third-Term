import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { FundsForm } from './funds.form';
import type { Fund } from '../types';

type FundsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fund?: Fund | null;
  userId?: number;
  onSubmit: (data: { user_id: number; name: string; balance?: string }) => Promise<void>;
  loading?: boolean;
};

export function FundsDialog({ open, onOpenChange, fund, userId, onSubmit, loading }: FundsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            {fund ? 'تعديل صندوق' : 'إضافة صندوق جديد'}
          </DialogTitle>
        </DialogHeader>
        <FundsForm
          defaultValues={fund}
          userId={userId}
          onSubmit={onSubmit}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
