import { useState } from 'react';
import { Download, Eye, MoreVertical, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import type { CloudFile } from '../../types';
import { FileType } from '../../registry/file-types';
import { IconRegistry } from '../../registry/icon-registry';
import { canPreview, formatSize, getFileType, resolveFileUrl } from '../../utils/file-utils';

interface FileCardProps {
  file: CloudFile;
  selected?: boolean;
  onSelect?: (file: CloudFile, selected: boolean) => void;
  onDelete: (file: CloudFile) => void;
  onDownload: (file: CloudFile) => void;
  onPreview?: (file: CloudFile) => void;
}

export function FileCard({ file, selected, onSelect, onDelete, onDownload, onPreview }: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const type = getFileType(file);
  const { icon: Icon, color } = IconRegistry[type];
  const preview = () => canPreview(file) && onPreview?.(file);

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('application/json', JSON.stringify({ type: 'file', id: file.id, data: file }));
        event.dataTransfer.effectAllowed = 'move';
      }}
      onContextMenu={(event) => { event.preventDefault(); setMenuOpen(true); }}
      onClick={preview}
      className={cn(
        'group relative min-w-0 cursor-pointer overflow-hidden rounded-2xl bg-muted/45 transition-colors hover:bg-muted/70',
        selected && 'bg-primary/5 ring-2 ring-primary'
      )}
    >
      <label className={cn('absolute end-3 top-3 z-10 transition-opacity', selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} onClick={(event) => event.stopPropagation()}>
        <input type="checkbox" checked={!!selected} onChange={(event) => onSelect?.(file, event.target.checked)} className="block size-4" aria-label={`تحديد ${file.file_name}`} />
      </label>

      <div className={cn('flex aspect-[4/3] items-center justify-center overflow-hidden', type !== FileType.Image && 'm-3 mb-0')}>
        {type === FileType.Image && file.url ? (
          <img src={resolveFileUrl(file.url) ?? undefined} alt="" loading="lazy" className="size-full object-cover rounded-xl p-2" />
        ) : (
          <div className="relative flex flex-col items-center">
            <Icon className={cn('size-16 stroke-[1.35]', color)} />
            <span className={cn('mt-[-12px] rounded-md bg-background px-2 py-0.5 text-[10px] font-bold shadow-sm', color)}>
              .{file.extension?.toUpperCase() || 'FILE'}
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 px-3 pb-3 pt-2 text-center">
        <p className="truncate text-sm font-medium" title={file.file_name}>{file.file_name}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{formatSize(file.size)}</p>
      </div>

      <div className="absolute start-2 top-2" onClick={(event) => event.stopPropagation()}>
        <DropdownMenu dir="rtl" open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild><Button size="icon-sm" variant="ghost" className="bg-background/80 opacity-0 shadow-sm group-hover:opacity-100"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {canPreview(file) && <DropdownMenuItem onSelect={() => setTimeout(preview, 0)}><Eye className="size-4" />معاينة</DropdownMenuItem>}
            <DropdownMenuItem onSelect={() => onDownload(file)}><Download className="size-4" />تنزيل</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTimeout(() => onDelete(file), 0)} className="text-destructive"><Trash2 className="size-4" />حذف</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
