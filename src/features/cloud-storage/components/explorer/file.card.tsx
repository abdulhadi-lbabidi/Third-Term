import { File as FileIcon, MoreVertical, Pencil, Trash2, Download, Image as ImageIcon, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import type { CloudFile } from '../../types';

interface FileCardProps {
  file: CloudFile;
  onRename: (file: CloudFile) => void;
  onDelete: (file: CloudFile) => void;
  onDownload: (file: CloudFile) => void;
}

const getFileIcon = (extension?: string | null) => {
  if (!extension) return FileIcon;
  const ext = extension.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return ImageIcon;
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return FileText;
  return FileIcon;
};

const formatSize = (sizeStr: string | number) => {
  if (typeof sizeStr === 'string') return sizeStr;
  if (sizeStr === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(sizeStr) / Math.log(k));
  return parseFloat((sizeStr / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function FileCard({ file, onRename, onDelete, onDownload }: FileCardProps) {
  const Icon = getFileIcon(file.extension);

  return (
    <div className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/60 bg-slate-50/50 p-6 transition-all hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm">
      <Icon className="size-10 text-slate-400 group-hover:text-blue-500 transition-colors" />
      <div className="flex flex-col items-center w-full">
        <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 truncate w-full text-center" title={file.file_name}>
          {file.file_name}
        </span>
        <span className="text-xs text-slate-400 mt-1">{formatSize(file.size)}</span>
      </div>

      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-full">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 rounded-xl">
            <DropdownMenuItem onClick={() => onDownload(file)} className="gap-2 cursor-pointer">
              <Download className="size-4 text-slate-500" />
              تحميل
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRename(file)} className="gap-2 cursor-pointer">
              <Pencil className="size-4 text-slate-500" />
              تعديل الاسم
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(file)} className="gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
              <Trash2 className="size-4" />
              حذف الملف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
