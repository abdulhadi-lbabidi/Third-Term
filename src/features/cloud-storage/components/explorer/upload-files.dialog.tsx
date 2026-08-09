import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, File as FileIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { useUploadFiles } from '../../hooks/cloud-storage.hooks';

interface UploadFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  directoryId: number | null;
}

export function UploadFilesDialog({ open, onOpenChange, directoryId }: UploadFilesDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const { mutate: uploadFiles, isPending } = useUploadFiles();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (!directoryId || files.length === 0) return;

    uploadFiles(
      { directoryId, files },
      {
        onSuccess: () => {
          setFiles([]);
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!isPending) {
        onOpenChange(val);
        if (!val) setFiles([]);
      }
    }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1rem)] overflow-y-auto p-4 sm:max-w-[500px] sm:p-6">
        <DialogHeader>
          <DialogTitle>رفع ملفات</DialogTitle>
          <DialogDescription>
            قم بسحب وإفلات الملفات هنا أو انقر لاختيار الملفات لرفعها إلى المجلد الحالي.
          </DialogDescription>
        </DialogHeader>
        
        <div 
          {...getRootProps()} 
          className={`mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-colors cursor-pointer sm:p-10
            ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'}
          `}
        >
          <input {...getInputProps()} />
          <UploadCloud className={`size-12 mb-4 ${isDragActive ? 'text-emerald-500' : 'text-slate-400'}`} />
          <p className="text-sm font-medium text-slate-700 text-center">
            {isDragActive ? 'أفلت الملفات هنا...' : 'اسحب الملفات وأفلتها هنا أو انقر للاختيار'}
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto space-y-2 pr-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-100 p-2 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileIcon className="size-4 text-slate-500 shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{file.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="size-6 rounded-full hover:bg-slate-200" disabled={isPending}>
                  <X className="size-3 text-slate-500" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            إلغاء
          </Button>
          <Button onClick={handleUpload} disabled={isPending || files.length === 0 || !directoryId} className="min-w-[120px] flex-1 sm:flex-none">
            {isPending ? 'جاري الرفع...' : `رفع (${files.length}) ملفات`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
