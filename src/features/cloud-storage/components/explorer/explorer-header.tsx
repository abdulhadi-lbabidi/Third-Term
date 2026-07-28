import { useState } from 'react';
import { Folder, UploadCloud, ChevronLeft, Search } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';

interface ExplorerHeaderProps {
  breadcrumbs: { id: number | null; name: string }[];
  onNavigate: (id: number | null) => void;
  onNewFolder: () => void;
  onUploadFiles: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onDropItem?: (targetFolderId: number | null, item: { type: 'file' | 'folder'; id: number; data?: unknown }) => void;
}

export function ExplorerHeader({
  breadcrumbs,
  onNavigate,
  onNewFolder,
  onUploadFiles,
  searchQuery,
  onSearchChange,
  onDropItem,
}: ExplorerHeaderProps) {
  const [dragOverId, setDragOverId] = useState<number | null | 'root'>(null);

  const handleDragOver = (e: React.DragEvent<HTMLElement>, id: number | null | 'root') => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('application/json')) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>, targetId: number | null) => {
    e.preventDefault();
    setDragOverId(null);

    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const item = JSON.parse(data) as { type: 'file' | 'folder'; id: number; data?: unknown };
        if (item.type === 'folder' && item.id === targetId) return;
        onDropItem?.(targetId, item);
      }
    } catch (err) {
      console.error('Failed to parse dropped item', err);
    }
  };

  return (
    <div className="mb-5 flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
      <div className="flex w-full items-center gap-1 overflow-x-auto pb-1 md:w-auto md:pb-0">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.id ?? 'root'} className="flex items-center">
            <button
              type="button"
              onClick={() => onNavigate(crumb.id)}
              onDragOver={(e) => handleDragOver(e, crumb.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, crumb.id)}
              className={cn(
                'whitespace-nowrap rounded-md px-2 py-1 text-sm font-medium transition-colors hover:text-foreground',
                index === breadcrumbs.length - 1 ? 'text-foreground' : 'text-muted-foreground',
                dragOverId === crumb.id ? 'bg-accent text-primary ring-1 ring-primary/40' : ''
              )}
            >
              {crumb.name}
            </button>
            {index < breadcrumbs.length - 1 ? (
              <ChevronLeft className="mx-0.5 size-4 shrink-0 text-muted-foreground" />
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex w-full items-center gap-2 md:w-auto">
        <div className="relative w-full md:w-64">
          <Search className="absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث في المجلد..."
            className="pe-9"
          />
        </div>

        <Button variant="outline" onClick={onNewFolder} className="shrink-0">
          <Folder className="size-4" />
          مجلد جديد
        </Button>
        <Button onClick={onUploadFiles} className="shrink-0">
          <UploadCloud className="size-4" />
          رفع ملفات
        </Button>
      </div>
    </div>
  );
}
