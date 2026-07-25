import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { FundForm, type FundFormValues } from './fund.form';

import type { FundTabType } from './fund-tabs';

interface FundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fund?: any | null;
  onConfirm: (values: FundFormValues) => void;
  isSubmitting?: boolean;
  fundType: FundTabType;
}

export function FundDialog({ open, onOpenChange, fund, onConfirm, isSubmitting, fundType }: FundDialogProps) {
  const isEditing = !!fund;

  const initialData = fund ? {
    name: fund.name,
    currency_id: fund.currency?.id || 0,
    owner_id: fund.owner_id,
    project_id: fund.project_id,
  } : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Fund' : 'Create New Fund'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this fund.' : 'Fill in the details to create a new fund.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <FundForm
            initialData={initialData}
            onSubmit={onConfirm}
            isLoading={isSubmitting}
            fundType={fundType}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
