import { useState } from 'react';
import { Folder, FolderPlus, MoreVertical, Pencil, Trash2, UploadCloud } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import type { Directory } from '../../types';

interface FolderCardProps {
  folder: Directory;
  selected?: boolean;
  onSelect?: (folder: Directory, selected: boolean) => void;
  onClick: (folder: Directory) => void;
  onRename: (folder: Directory) => void;
  onDelete: (folder: Directory) => void;
  onNewFolder?: (folder: Directory) => void;
  onUploadFiles?: (folder: Directory) => void;
  onDropItem?: (targetFolderId: number, item: { type: 'file' | 'folder'; id: number; data?: unknown }) => void;
}

export function FolderCard({ folder, selected, onSelect, onClick, onRename, onDelete, onNewFolder, onUploadFiles, onDropItem }: FolderCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const name = folder.dir_name || 'بدون اسم';

  return (
    <div
      draggable
      onDragStart={(event) => { event.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: folder.id, data: folder })); event.dataTransfer.effectAllowed = 'move'; }}
      onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault(); setDragOver(false);
        try { const item = JSON.parse(event.dataTransfer.getData('application/json')); if (!(item.type === 'folder' && item.id === folder.id)) onDropItem?.(folder.id, item); } catch { /* ignored */ }
      }}
      onContextMenu={(event) => { event.preventDefault(); setMenuOpen(true); }}
      onClick={() => onClick(folder)}
      className={cn('group relative min-w-0 cursor-pointer rounded-2xl bg-muted/45 p-3 transition-colors hover:bg-muted/70', (selected || dragOver) && 'bg-primary/5 ring-2 ring-primary')}
    >
      <label className={cn('absolute end-3 top-3 z-10 transition-opacity', selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} onClick={(event) => event.stopPropagation()}>
        <input type="checkbox" checked={!!selected} onChange={(event) => onSelect?.(folder, event.target.checked)} className="block size-4" aria-label={`تحديد ${name}`} />
      </label>

      <div className="flex aspect-[4/3] items-center justify-center"><Folder className="size-20 fill-primary/15 stroke-[1.25] text-primary" /></div>
      <div className="min-w-0 px-1 pb-1 pt-2 text-center"><p className="truncate text-sm font-medium" title={name}>{name}</p><p className="mt-0.5 text-[11px] text-muted-foreground">مجلد</p></div>

      <div className="absolute start-2 top-2" onClick={(event) => event.stopPropagation()}>
        <DropdownMenu dir="rtl" open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" className="bg-background/80 opacity-0 shadow-sm group-hover:opacity-100"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => setTimeout(() => onNewFolder?.(folder), 0)}><FolderPlus className="size-4" />مجلد جديد</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTimeout(() => onUploadFiles?.(folder), 0)}><UploadCloud className="size-4" />رفع ملفات</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTimeout(() => onRename(folder), 0)}><Pencil className="size-4" />إعادة تسمية</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTimeout(() => onDelete(folder), 0)} className="text-destructive"><Trash2 className="size-4" />حذف</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
