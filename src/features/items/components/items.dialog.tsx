import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { ItemsForm } from './items.form';
import type { CreateItemPayload, Item } from '../types';

type ItemsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  onSubmit: (data: CreateItemPayload) => Promise<void>;
  loading?: boolean;
};

export function ItemsDialog({ open, onOpenChange, item, onSubmit, loading }: ItemsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{item ? 'تعديل البند' : 'إضافة بند جديد'}</DialogTitle>
        </DialogHeader>
        {open && <ItemsForm defaultValues={item} onSubmit={onSubmit} loading={loading} />}
      </DialogContent>
    </Dialog>
  );
}
