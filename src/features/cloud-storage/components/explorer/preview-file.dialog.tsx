import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import type { CloudFile } from '../../types';

interface PreviewFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: CloudFile | null;
}

const isImage = (extension?: string | null) => {
  if (!extension) return false;
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension.toLowerCase());
};

export function PreviewFileDialog({ open, onOpenChange, file }: PreviewFileDialogProps) {
  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-0.5rem)] max-w-none flex-col overflow-hidden bg-slate-50 p-0 sm:w-[min(94vw,56rem)]">
        <DialogHeader className="p-4 border-b bg-white">
          <DialogTitle>{file.file_name || 'معاينة الملف'}</DialogTitle>
        </DialogHeader>
        
        <div className="relative flex min-h-[240px] flex-1 items-center justify-center overflow-auto p-2 sm:min-h-[400px] sm:p-4">
          {!file.url ? (
            <div className="text-slate-500 text-center">لا يوجد رابط لمعاينة هذا الملف.</div>
          ) : isImage(file.extension) ? (
            <img 
              src={file.url} 
              alt={file.file_name} 
              className="max-w-full max-h-[70vh] object-contain rounded shadow-sm"
            />
          ) : (
            <iframe 
              src={file.url} 
              className="w-full h-full min-h-[70vh] rounded shadow-sm bg-white"
              title={file.file_name}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
