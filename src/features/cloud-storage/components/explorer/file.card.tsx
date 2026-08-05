import { useState } from 'react';
import { toast } from 'sonner';
import { MoreVertical, Trash2, Download, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import type { CloudFile } from '../../types';
import { IconRegistry } from '../../registry/icon-registry';
import { getFileType, canPreview, formatSize } from '../../utils/file-utils';

interface FileCardProps {
  file: CloudFile;
  selected?: boolean;
  onSelect?: (file: CloudFile, selected: boolean) => void;
  onRename: (file: CloudFile) => void;
  onDelete: (file: CloudFile) => void;
  onDownload: (file: CloudFile) => void;
  onPreview?: (file: CloudFile) => void;
}

export function FileCard({
  file,
  selected,
  onSelect,
  onDelete,
  onDownload,
  onPreview,
}: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const fileType = getFileType(file);
  const { icon: Icon, color, bg } = IconRegistry[fileType];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'file', id: file.id, data: file }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuOpen(true);
      }}
      className={cn(
        'group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border p-5 transition-colors',
        selected
          ? 'border-primary/40 bg-accent shadow-[var(--shadow-finance)]'
          : 'border-border bg-card hover:border-primary/25 hover:bg-muted/40'
      )}
      onClick={() => {
        if (canPreview(file)) {
          onPreview?.(file);
        } else {
          toast.info('لا تتوفر معاينة لهذا النوع من الملفات');
        }
      }}
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
          onChange={(e) => onSelect?.(file, e.target.checked)}
          aria-label={`تحديد ${file.file_name}`}
        />
      </div>

      <div className={cn('rounded-md p-3 transition-colors', bg)}>
        <Icon className={cn('size-7', color)} />
      </div>
      <div className="flex w-full flex-col items-center">
        <TooltipProvider delay={300}>
          <Tooltip>
            <TooltipTrigger className="block w-full truncate border-none bg-transparent p-0 text-center text-sm font-medium text-foreground focus:outline-none">
              {file.file_name}
            </TooltipTrigger>
            <TooltipContent>{file.file_name}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="mt-1 text-xs text-muted-foreground finance-num">{formatSize(file.size)}</span>
      </div>

      <div className="absolute top-2 start-2 opacity-0 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu dir="rtl" open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="خيارات الملف">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {onPreview && canPreview(file) ? (
              <DropdownMenuItem onSelect={() => setTimeout(() => onPreview(file), 0)} className="gap-2 cursor-pointer">
                <Eye className="size-4 text-muted-foreground" />
                معاينة
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={() => onDownload(file)} className="gap-2 cursor-pointer">
              <Download className="size-4 text-muted-foreground" />
              تحميل
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setTimeout(() => onDelete(file), 0)}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              حذف الملف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
