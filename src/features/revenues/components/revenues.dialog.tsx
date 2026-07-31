import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { RevenuesForm } from './revenues.form';
import type { CreateRevenuePayload, Revenue } from '../types';

type RevenuesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Revenue | null;
  fixedValues?: {
    source?: 'company_fund' | 'user_fund' | 'project_fund';
    project_id?: number;
    project_fund_id?: number;
    user_id?: number;
    user_fund_id?: number;
    company_fund_id?: number;
    fund_user_role?: string;
  };
  onSubmit: (data: CreateRevenuePayload) => Promise<void>;
  loading?: boolean;
};

export function RevenuesDialog({ open, onOpenChange, defaultValues, fixedValues, onSubmit, loading }: RevenuesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'تعديل الإيراد' : 'إضافة إيراد جديد'}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {open && (
            <RevenuesForm
              defaultValues={defaultValues}
              fixedValues={fixedValues}
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
