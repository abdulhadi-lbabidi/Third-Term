import { useState } from 'react';
import { Folder, MoreVertical, Pencil, Trash2, FolderPlus, UploadCloud } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import type { Directory } from '../../types';

interface FolderCardProps {
  folder: Directory;
  selected?: boolean;
  onSelect?: (folder: Directory, selected: boolean) => void;
  onClick: (folder: Directory) => void;
  onRename: (folder: Directory) => void;
  onDelete: (folder: Directory) => void;
  onDownload?: (folder: Directory) => void;
  onNewFolder?: (folder: Directory) => void;
  onUploadFiles?: (folder: Directory) => void;
  onDropItem?: (targetFolderId: number, item: { type: 'file' | 'folder'; id: number; data?: any }) => void;
}

export function FolderCard({ folder, selected, onSelect, onClick, onRename, onDelete, onNewFolder, onUploadFiles, onDropItem }: FolderCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const name = folder.dir_name || (folder as any).name || 'بدون اسم';

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: folder.id, data: folder }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('application/json')) {
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const item = JSON.parse(data);
        // Don't drop folder into itself
        if (item.type === 'folder' && item.id === folder.id) return;
        onDropItem?.(folder.id, item);
      }
    } catch (err) {
      console.error('Failed to parse dropped item', err);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuOpen(true);
      }}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 transition-all cursor-pointer hover:shadow-sm",
        isDragOver
          ? "border-emerald-500 bg-emerald-100/50 shadow-md scale-105"
          : selected
            ? "border-emerald-400 bg-emerald-50/50 shadow-sm"
            : "border-slate-200/60 bg-slate-50/50 hover:border-emerald-200 hover:bg-emerald-50/30"
      )}
      onClick={() => onClick(folder)}
    >
      <div
        className={cn(
          "absolute top-3 right-3 transition-opacity z-10",
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          checked={selected}
          onChange={(e) => onSelect?.(folder, e.target.checked)}
        />
      </div>

      <Folder className={cn("size-10 transition-colors", isDragOver ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500")} />
      
      <TooltipProvider delay={300}>
        <Tooltip>
          <TooltipTrigger className="text-sm font-medium text-slate-700 group-hover:text-emerald-700 truncate w-full text-center focus:outline-none cursor-default bg-transparent border-none p-0 block mt-3">
            {name}
          </TooltipTrigger>
          <TooltipContent>
            {name}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu dir='rtl' open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-full">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 rounded-xl">
            {/* <DropdownMenuItem onClick={() => onDownload?.(folder)} className="gap-2 cursor-pointer">
              <Download className="size-4 text-slate-500" />
              تحميل
            </DropdownMenuItem> */}
            <DropdownMenuItem onClick={() => onNewFolder?.(folder)} className="gap-2 cursor-pointer">
              <FolderPlus className="size-4 text-slate-500" />
              مجلد جديد
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUploadFiles?.(folder)} className="gap-2 cursor-pointer">
              <UploadCloud className="size-4 text-slate-500" />
              رفع ملفات
            </DropdownMenuItem>
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
