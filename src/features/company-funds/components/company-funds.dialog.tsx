import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { CompanyFundsForm } from './company-funds.form';
import type { CompanyFund } from '../types';

type CompanyFundsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyFund?: CompanyFund | null;
  onSubmit: (data: { name: string }) => Promise<void>;
  loading?: boolean;
};

export function CompanyFundsDialog({
  open,
  onOpenChange,
  companyFund,
  onSubmit,
  loading,
}: CompanyFundsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{companyFund ? 'تعديل صندوق الشركة' : 'إضافة صندوق الشركة'}</DialogTitle>
        </DialogHeader>
        <CompanyFundsForm
          defaultValues={companyFund}
          onSubmit={onSubmit}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
