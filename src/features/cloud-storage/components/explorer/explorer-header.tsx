import { useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { ArrowDownAZ, ArrowUpAZ, Check, ChevronLeft, Cloud, FolderPlus, Grid2X2, List, Search, UploadCloud, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import type { ExplorerSortBy, ExplorerSortDirection, ExplorerViewMode } from '../../types';

interface ExplorerHeaderProps {
  breadcrumbs: { id: number | null; name: string }[];
  onNavigate: (id: number | null) => void;
  onNewFolder: () => void;
  onUploadFiles: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  viewMode: ExplorerViewMode;
  onViewModeChange: (mode: ExplorerViewMode) => void;
  sortBy: ExplorerSortBy;
  onSortByChange: (sort: ExplorerSortBy) => void;
  sortDirection: ExplorerSortDirection;
  onToggleSortDirection: () => void;
  selectionTools: ReactNode;
  filterTools?: ReactNode;
  onDropItem?: (targetFolderId: number | null, item: { type: 'file' | 'folder'; id: number; data?: unknown }) => void;
}

export function ExplorerHeader(props: ExplorerHeaderProps) {
  const [dragOverId, setDragOverId] = useState<number | null | 'root'>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const breadcrumbsDragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const breadcrumbsDraggingRef = useRef(false);
  const breadcrumbsDragMovedRef = useRef(false);
  const sortLabels: Record<ExplorerSortBy, string> = { name: 'الاسم', size: 'الحجم', date: 'التاريخ', type: 'النوع' };
  const handleDrop = (event: React.DragEvent<HTMLElement>, targetId: number | null) => {
    event.preventDefault(); setDragOverId(null);
    try {
      const item = JSON.parse(event.dataTransfer.getData('application/json')) as { type: 'file' | 'folder'; id: number; data?: unknown };
      if (!(item.type === 'folder' && item.id === targetId)) props.onDropItem?.(targetId, item);
    } catch { /* ignored */ }
  };

  const handleBreadcrumbsPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    breadcrumbsDragMovedRef.current = false;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    breadcrumbsDraggingRef.current = true;
    breadcrumbsDragStartRef.current = { x: event.clientX, scrollLeft: event.currentTarget.scrollLeft };
  };

  const handleBreadcrumbsPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!breadcrumbsDraggingRef.current) return;
    const distance = event.clientX - breadcrumbsDragStartRef.current.x;
    if (Math.abs(distance) > 8) breadcrumbsDragMovedRef.current = true;
    event.currentTarget.scrollLeft = breadcrumbsDragStartRef.current.scrollLeft - distance;
  };

  const stopBreadcrumbsDragging = () => {
    breadcrumbsDraggingRef.current = false;
  };

  const preventBreadcrumbClickAfterDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!breadcrumbsDragMovedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    breadcrumbsDragMovedRef.current = false;
  };

  return (
    <TooltipProvider>
    <div className="min-w-0 space-y-3 px-3 pb-3 pt-3 sm:px-5 sm:pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cloud className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">التخزين السحابي</h1>
            <p className="text-xs text-muted-foreground">الملفات العامة</p>
          </div>
        </div>
        <div className="ms-auto flex flex-wrap justify-end gap-2">
          <Tooltip><TooltipTrigger render={<Button variant="outline" size="sm" onClick={props.onNewFolder} aria-label="مجلد جديد" />}><FolderPlus className="size-4" /><span className="hidden sm:inline">مجلد جديد</span></TooltipTrigger><TooltipContent>مجلد جديد</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger render={<Button size="sm" onClick={props.onUploadFiles} aria-label="رفع ملفات" />}><UploadCloud className="size-4" /><span className="hidden sm:inline">رفع ملفات</span></TooltipTrigger><TooltipContent>رفع ملفات</TooltipContent></Tooltip>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 xl:flex-nowrap">
        {props.selectionTools}
        <div className="ms-auto flex min-w-0 w-full flex-wrap items-center justify-end gap-2 xl:w-auto xl:flex-nowrap">
        {props.filterTools}
        {!mobileSearchOpen && <Tooltip><TooltipTrigger render={<Button type="button" variant="outline" size="icon-sm" className="sm:hidden" onClick={() => setMobileSearchOpen(true)} aria-label="البحث" />}><Search className="size-4" /></TooltipTrigger><TooltipContent>البحث</TooltipContent></Tooltip>}
        <div className={cn('relative order-first min-w-0 basis-full sm:order-none sm:block sm:basis-auto sm:flex-1 xl:w-64 xl:flex-none', !mobileSearchOpen && 'hidden')}>
          <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus={mobileSearchOpen} value={props.searchQuery} onChange={(e) => props.onSearchChange(e.target.value)} placeholder="بحث في المجلد..." className="h-9 pe-9 ps-9" />
          <button type="button" onClick={() => setMobileSearchOpen(false)} className="absolute start-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground sm:hidden" aria-label="إغلاق البحث"><X className="size-4" /></button>
        </div>
        <DropdownMenu>
          <Tooltip><TooltipTrigger render={<span />}><DropdownMenuTrigger asChild><Button variant="outline" size="sm" aria-label="الترتيب">{props.sortDirection === 'asc' ? <ArrowDownAZ className="size-4" /> : <ArrowUpAZ className="size-4" />}<span className="hidden sm:inline">{sortLabels[props.sortBy]}</span></Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent>نوع واتجاه الترتيب</TooltipContent></Tooltip>
          <DropdownMenuContent align="end">
            {(Object.entries(sortLabels) as [ExplorerSortBy, string][]).map(([value, label]) => <DropdownMenuItem key={value} onSelect={() => props.onSortByChange(value)}>{props.sortBy === value && <Check className="size-4" />}{label}</DropdownMenuItem>)}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={props.onToggleSortDirection}>{props.sortDirection === 'asc' ? <ArrowUpAZ className="size-4" /> : <ArrowDownAZ className="size-4" />}{props.sortDirection === 'asc' ? 'ترتيب تنازلي' : 'ترتيب تصاعدي'}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex rounded-md bg-muted/60 p-0.5">
          <Tooltip><TooltipTrigger render={<Button variant={props.viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => props.onViewModeChange('grid')} aria-label="عرض شبكي" />}><Grid2X2 className="size-4" /></TooltipTrigger><TooltipContent>عرض شبكي</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger render={<Button variant={props.viewMode === 'list' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => props.onViewModeChange('list')} aria-label="عرض قائمة" />}><List className="size-4" /></TooltipTrigger><TooltipContent>عرض قائمة</TooltipContent></Tooltip>
        </div>
        </div>
      </div>

      <div
        dir="rtl"
        className="flex min-h-10 min-w-0 cursor-grab touch-pan-x select-none items-center gap-1 overflow-x-auto rounded-lg bg-muted/45 px-2 py-1 active:cursor-grabbing"
        onPointerDown={handleBreadcrumbsPointerDown}
        onPointerMove={handleBreadcrumbsPointerMove}
        onPointerUp={stopBreadcrumbsDragging}
        onPointerCancel={stopBreadcrumbsDragging}
        onPointerLeave={stopBreadcrumbsDragging}
        onClickCapture={preventBreadcrumbClickAfterDrag}
        onDragStart={(event) => event.preventDefault()}
      >
          {props.breadcrumbs.map((crumb, index) => <div key={crumb.id ?? 'root'} className="flex items-center">
            <button type="button" onClick={() => props.onNavigate(crumb.id)}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(crumb.id ?? 'root'); }} onDragLeave={() => setDragOverId(null)} onDrop={(e) => handleDrop(e, crumb.id)}
              className={cn('whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted', dragOverId === (crumb.id ?? 'root') && 'bg-accent ring-1 ring-primary/40', index < props.breadcrumbs.length - 1 ? 'text-muted-foreground' : 'font-medium')}>
              {crumb.name}
            </button>{index < props.breadcrumbs.length - 1 && <ChevronLeft className="size-4 text-muted-foreground" />}
          </div>)}
      </div>
    </div>
    </TooltipProvider>
  );
}
