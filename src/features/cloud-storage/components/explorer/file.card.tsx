import { useState } from 'react';
import { MoreVertical, Trash2, Download, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
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

// Externalized to utils and registries

export function FileCard({ file, selected, onSelect,
  // onRename,
  onDelete, onDownload, onPreview }: FileCardProps) {
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
        onPreview?.(file)
      }}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-3 rounded-2xl border p-6 transition-all cursor-pointer hover:shadow-sm",
        selected
          ? "border-blue-400 bg-blue-50/50 shadow-sm"
          : "border-slate-200/60 bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/30"
      )}
      onClick={() => {
        if (canPreview(file)) onPreview?.(file);
      }}
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
          className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          checked={selected}
          onChange={(e) => onSelect?.(file, e.target.checked)}
        />
      </div>

      <div className={cn("p-3 rounded-xl transition-colors", bg)}>
        <Icon className={cn("size-8", color)} />
      </div>
      <div className="flex flex-col items-center w-full">
        <TooltipProvider delay={300}>
          <Tooltip>
            <TooltipTrigger className="text-sm font-medium text-slate-700 group-hover:text-blue-700 truncate w-full text-center focus:outline-none cursor-default bg-transparent border-none p-0 block">
              {file.file_name}
            </TooltipTrigger>
            <TooltipContent>
              {file.file_name}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-xs text-slate-400 mt-1">{formatSize(file.size)}</span>
      </div>

      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu dir='rtl' open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-full">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 rounded-xl">
            {onPreview && canPreview(file) && (
              <DropdownMenuItem onClick={() => onPreview(file)} className="gap-2 cursor-pointer">
                <Eye className="size-4 text-slate-500" />
                معاينة
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDownload(file)} className="gap-2 cursor-pointer">
              <Download className="size-4 text-slate-500" />
              تحميل
            </DropdownMenuItem>
            {/* <DropdownMenuItem onClick={() => onRename(file)} className="gap-2 cursor-pointer">
                <Pencil className="size-4 text-slate-500" />
                تعديل الاسم
              </DropdownMenuItem> */}
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
