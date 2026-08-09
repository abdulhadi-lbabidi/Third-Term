import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { MaterialForm } from './material.form';
import type { Material } from '../types';
import type { MaterialFormValues } from '../schemas/materials.schema';

type MaterialDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material | null;
  onSubmit: (data: MaterialFormValues) => Promise<void>;
  loading?: boolean;
};

export function MaterialDialog({ open, onOpenChange, material, onSubmit, loading }: MaterialDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1rem)] overflow-y-auto p-4 sm:max-w-[520px] sm:p-6">
        <DialogHeader>
          <DialogTitle>{material ? 'تعديل مادة' : 'إضافة مادة جديدة'}</DialogTitle>
        </DialogHeader>
        {open && <MaterialForm defaultValues={material} onSubmit={onSubmit} loading={loading} />}
      </DialogContent>
    </Dialog>
  );
}
