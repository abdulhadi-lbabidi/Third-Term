import { useState } from 'react';
import { Folder, MoreVertical, Pencil, Trash2, FolderPlus, UploadCloud } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/shared/components/ui/tooltip';
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
  onDropItem?: (targetFolderId: number, item: { type: 'file' | 'folder'; id: number; data?: unknown }) => void;
}

export function FolderCard({
  folder,
  selected,
  onSelect,
  onClick,
  onRename,
  onDelete,
  onNewFolder,
  onUploadFiles,
  onDropItem,
}: FolderCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const name = folder.dir_name || (folder as { name?: string }).name || 'بدون اسم';

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
        const item = JSON.parse(data) as { type: 'file' | 'folder'; id: number; data?: unknown };
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
        'group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border p-5 transition-colors',
        isDragOver
          ? 'border-primary bg-accent shadow-[var(--shadow-finance)]'
          : selected
            ? 'border-primary/40 bg-accent shadow-[var(--shadow-finance)]'
            : 'border-border bg-card hover:border-primary/25 hover:bg-muted/40'
      )}
      onClick={() => onClick(folder)}
    >
      <div
        className={cn(
          'absolute top-3 end-3 z-10 transition-opacity',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          className="size-4 cursor-pointer rounded border-border text-primary focus:ring-ring"
          checked={selected}
          onChange={(e) => onSelect?.(folder, e.target.checked)}
          aria-label={`تحديد ${name}`}
        />
      </div>

      <Folder
        className={cn(
          'size-9 transition-colors',
          isDragOver || selected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
        )}
      />

      <TooltipProvider delay={300}>
        <Tooltip>
          <TooltipTrigger className="mt-1 block w-full truncate border-none bg-transparent p-0 text-center text-sm font-medium text-foreground focus:outline-none">
            {name}
          </TooltipTrigger>
          <TooltipContent>{name}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="absolute top-2 start-2 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu dir="rtl" open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="خيارات المجلد">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem onSelect={() => setTimeout(() => onNewFolder?.(folder), 0)} className="gap-2 cursor-pointer">
              <FolderPlus className="size-4 text-muted-foreground" />
              مجلد جديد
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTimeout(() => onUploadFiles?.(folder), 0)} className="gap-2 cursor-pointer">
              <UploadCloud className="size-4 text-muted-foreground" />
              رفع ملفات
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTimeout(() => onRename(folder), 0)} className="gap-2 cursor-pointer">
              <Pencil className="size-4 text-muted-foreground" />
              تعديل الاسم
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setTimeout(() => onDelete(folder), 0)}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              حذف المجلد
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
