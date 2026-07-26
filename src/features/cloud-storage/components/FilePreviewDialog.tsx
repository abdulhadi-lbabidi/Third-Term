import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import type { CloudFile } from '../types';
import { PreviewRenderer } from './PreviewRenderer';
import { IconRegistry } from '../registry/icon-registry';
import { getFileType } from '../utils/file-utils';

interface FilePreviewDialogProps {
  file: CloudFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FilePreviewDialog = ({ file, open, onOpenChange }: FilePreviewDialogProps) => {
  if (!file) return null;

  const type = getFileType(file);
  const { icon: Icon, color } = IconRegistry[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden gap-0 bg-slate-50">
        <DialogHeader className="px-4 py-3 border-b bg-white shrink-0 flex flex-row items-center gap-3 space-y-0">
          <Icon className={`size-5 ${color}`} />
          <DialogTitle className="text-base font-semibold truncate flex-1 text-right" dir="auto">
            {file.file_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-slate-100/50 relative">
          <PreviewRenderer file={file} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
