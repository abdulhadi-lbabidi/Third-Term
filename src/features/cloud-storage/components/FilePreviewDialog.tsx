import { Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import type { CloudFile } from '../types';
import { PreviewRenderer } from './PreviewRenderer';
import { IconRegistry } from '../registry/icon-registry';
import { getFileType } from '../utils/file-utils';

interface FilePreviewDialogProps {
  file: CloudFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (file: CloudFile) => void;
}

export const FilePreviewDialog = ({ file, open, onOpenChange, onDownload }: FilePreviewDialogProps) => {
  if (!file) return null;

  const type = getFileType(file);
  const { icon: Icon, color } = IconRegistry[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-w-5xl flex-col gap-0 overflow-hidden bg-slate-50 p-0">
        <DialogHeader className="flex shrink-0 flex-row items-center gap-3 space-y-0 border-b bg-white py-3 ps-4 pe-12">
          <div className="rounded-md bg-muted p-2"><Icon className={`size-5 ${color}`} /></div>
          <div className="min-w-0 flex-1 text-right">
            <DialogTitle className="truncate text-sm font-semibold" dir="auto">{file.file_name}</DialogTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{file.extension?.toUpperCase() || 'ملف'} · {file.size}</p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => onDownload(file)}>
            <Download className="size-4" /> تنزيل
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-slate-100/50 relative">
          <PreviewRenderer file={file} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
