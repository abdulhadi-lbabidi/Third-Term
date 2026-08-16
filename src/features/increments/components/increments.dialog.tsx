import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { IncrementsForm } from './increments.form';
import type { CreateIncrementPayload, Increment, UpdateIncrementPayload } from '../types';
import type { EmployeeRecord } from '@/features/users/types';

type IncrementsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EmployeeRecord[];
  increment?: Increment | null;
  lockedEmployeeId?: number | null;
  onSubmit: (data: CreateIncrementPayload | UpdateIncrementPayload) => Promise<void>;
  loading?: boolean;
};

export function IncrementsDialog({
  open,
  onOpenChange,
  employees,
  increment,
  lockedEmployeeId,
  onSubmit,
  loading,
}: IncrementsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{increment ? 'تعديل زيادة' : 'إضافة زيادة جديدة'}</DialogTitle>
        </DialogHeader>
        <IncrementsForm
          key={increment?.id ?? 'new'}
          employees={employees}
          defaultValues={increment}
          lockedEmployeeId={lockedEmployeeId}
          onSubmit={onSubmit}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
