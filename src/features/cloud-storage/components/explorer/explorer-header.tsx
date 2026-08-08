import { useState, type ReactNode } from 'react';
import { ArrowDownAZ, ArrowUpAZ, ChevronLeft, Cloud, FolderPlus, Grid2X2, List, Search, UploadCloud } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
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
  const handleDrop = (event: React.DragEvent<HTMLElement>, targetId: number | null) => {
    event.preventDefault(); setDragOverId(null);
    try {
      const item = JSON.parse(event.dataTransfer.getData('application/json')) as { type: 'file' | 'folder'; id: number; data?: unknown };
      if (!(item.type === 'folder' && item.id === targetId)) props.onDropItem?.(targetId, item);
    } catch { /* ignored */ }
  };

  return (
    <div className="space-y-3 px-4 pb-3 pt-4 sm:px-5">
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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={props.onNewFolder}><FolderPlus className="size-4" />مجلد جديد</Button>
          <Button size="sm" onClick={props.onUploadFiles}><UploadCloud className="size-4" />رفع ملفات</Button>
        </div>
      </div>

      <div className="flex min-h-10 min-w-0 items-center gap-1 overflow-x-auto rounded-lg bg-muted/45 px-2 py-1">
          {props.breadcrumbs.map((crumb, index) => <div key={crumb.id ?? 'root'} className="flex items-center">
            <button type="button" onClick={() => props.onNavigate(crumb.id)}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(crumb.id ?? 'root'); }} onDragLeave={() => setDragOverId(null)} onDrop={(e) => handleDrop(e, crumb.id)}
              className={cn('whitespace-nowrap rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted', dragOverId === (crumb.id ?? 'root') && 'bg-accent ring-1 ring-primary/40', index < props.breadcrumbs.length - 1 ? 'text-muted-foreground' : 'font-medium')}>
              {crumb.name}
            </button>{index < props.breadcrumbs.length - 1 && <ChevronLeft className="size-4 text-muted-foreground" />}
          </div>)}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 xl:flex-nowrap">
        {props.selectionTools}
        <div className="ms-auto flex w-full flex-wrap items-center gap-2 sm:w-auto xl:flex-nowrap">
        {props.filterTools}
        <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
          <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={props.searchQuery} onChange={(e) => props.onSearchChange(e.target.value)} placeholder="بحث في المجلد..." className="h-9 pe-9" />
        </div>
        <div className="w-36 shrink-0">
          <SearchableSelect
            value={props.sortBy}
            onValueChange={(value) => props.onSortByChange(value as ExplorerSortBy)}
            options={[
              { value: 'name', label: 'الاسم' },
              { value: 'size', label: 'الحجم' },
              { value: 'date', label: 'التاريخ' },
              { value: 'type', label: 'النوع' },
            ]}
            placeholder="ترتيب حسب"
            searchPlaceholder="ابحث عن فلتر..."
            emptyMessage="لا يوجد فلتر مطابق"
            className="h-9 min-h-9 bg-background py-1"
          />
        </div>
        <Button variant="outline" size="icon-sm" onClick={props.onToggleSortDirection} aria-label="عكس ترتيب الفرز">{props.sortDirection === 'asc' ? <ArrowDownAZ className="size-4" /> : <ArrowUpAZ className="size-4" />}</Button>
        <div className="flex rounded-md bg-muted/60 p-0.5">
          <Button variant={props.viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => props.onViewModeChange('grid')} aria-label="عرض شبكي"><Grid2X2 className="size-4" /></Button>
          <Button variant={props.viewMode === 'list' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => props.onViewModeChange('list')} aria-label="عرض قائمة"><List className="size-4" /></Button>
        </div>
        </div>
      </div>
    </div>
  );
}
