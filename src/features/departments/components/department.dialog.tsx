import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { DepartmentForm } from './department.form';
import type { Department, CreateDepartmentPayload } from '../types';

type DepartmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  onSubmit: (data: CreateDepartmentPayload) => Promise<void>;
  loading?: boolean;
};

export function DepartmentDialog({ open, onOpenChange, department, onSubmit, loading }: DepartmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{department ? 'تعديل القسم' : 'إضافة قسم جديد'}</DialogTitle>
        </DialogHeader>
        <div className="p-4 pt-0">
            <DepartmentForm
              defaultValues={department || undefined}
              onSubmit={onSubmit}
              loading={loading}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
