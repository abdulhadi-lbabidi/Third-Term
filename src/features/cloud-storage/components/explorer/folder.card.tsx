import { Folder, MoreVertical, Pencil, Trash2, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import type { Directory } from '../../types';

interface FolderCardProps {
  folder: Directory;
  onClick: (folder: Directory) => void;
  onRename: (folder: Directory) => void;
  onDelete: (folder: Directory) => void;
}

export function FolderCard({ folder, onClick, onRename, onDelete }: FolderCardProps) {
  return (
    <div 
      className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/60 bg-slate-50/50 p-6 transition-all hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-sm cursor-pointer"
      onClick={() => onClick(folder)}
    >
      <Folder className="size-10 text-slate-400 group-hover:text-emerald-500 transition-colors" />
      <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-700 truncate w-full text-center" title={folder.dir_name}>
        {folder.dir_name}
      </span>

      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-full">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 rounded-xl">
            <DropdownMenuItem onClick={() => onRename(folder)} className="gap-2 cursor-pointer">
              <Pencil className="size-4 text-slate-500" />
              تعديل الاسم
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(folder)} className="gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
              <Trash2 className="size-4" />
              حذف المجلد
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
