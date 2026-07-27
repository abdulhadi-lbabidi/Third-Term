import type { CloudFile } from '../../types';
import { Archive } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export const ArchiveViewer = ({ file }: { file: CloudFile }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 p-8 gap-4">
      <div className="size-24 rounded-full bg-amber-100 flex items-center justify-center">
        <Archive className="size-10 text-amber-600" />
      </div>
      <h3 className="text-lg font-medium text-slate-800">{file.file_name}</h3>
      <p className="text-sm text-slate-500 text-center max-w-sm mb-4">
        لا يمكن معاينة الملفات المضغوطة مباشرة. يرجى تنزيل الملف لفحص محتوياته.
      </p>
      {file.url && (
        <Button>
          <a href={file.url} download={file.file_name} target="_blank" rel="noreferrer">
            تنزيل الملف
          </a>
        </Button>
      )}
    </div>
  );
};
