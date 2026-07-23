import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { RenameFileForm, type RenameFormValues } from './rename_file.form';
import type { CloudFile } from '../types';

interface RenameFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: CloudFile | null;
  onConfirm: (fileId: string, values: RenameFormValues) => void;
  isSubmitting?: boolean;
}

export function RenameFileDialog({ open, onOpenChange, file, onConfirm, isSubmitting }: RenameFileDialogProps) {
  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename File</DialogTitle>
          <DialogDescription>
            Enter a new name for the file. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <RenameFileForm
            initialName={file.name}
            onSubmit={(values) => onConfirm(file.id, values)}
            isLoading={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
