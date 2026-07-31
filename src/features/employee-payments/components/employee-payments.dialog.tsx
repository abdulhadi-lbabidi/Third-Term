import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { EmployeePaymentsForm } from './employee-payments.form';
import type { CreateEmployeePaymentPayload, EmployeePayment } from '../types';
import type { EmployeeRecord } from '@/features/users/types';

type EmployeePaymentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EmployeeRecord[];
  employeePayment?: EmployeePayment | null;
  lockedEmployeeId?: number | null;
  onSubmit: (data: CreateEmployeePaymentPayload) => Promise<void>;
  loading?: boolean;
};

export function EmployeePaymentsDialog({
  open,
  onOpenChange,
  employees,
  employeePayment,
  lockedEmployeeId,
  onSubmit,
  loading,
}: EmployeePaymentsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{employeePayment ? 'تعديل راتب الموظف' : 'إضافة راتب موظف'}</DialogTitle>
        </DialogHeader>
        {open && (
          <EmployeePaymentsForm
            employees={employees}
            defaultValues={employeePayment}
            lockedEmployeeId={lockedEmployeeId}
            onSubmit={onSubmit}
            loading={loading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
