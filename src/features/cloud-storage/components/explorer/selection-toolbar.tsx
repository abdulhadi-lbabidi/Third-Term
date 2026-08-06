import { CheckCheck, Copy, Trash2, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface SelectionToolbarProps {
  selectedCount: number;
  hasItems: boolean;
  allItemsSelected: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export function SelectionToolbar({
  selectedCount,
  hasItems,
  allItemsSelected,
  onToggleSelectAll,
  onClearSelection,
  onCopy,
  onDelete,
}: SelectionToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
      <Button
        type="button"
        size="sm"
        variant={allItemsSelected ? 'secondary' : 'outline'}
        onClick={onToggleSelectAll}
        disabled={!hasItems}
        aria-pressed={allItemsSelected}
      >
        <CheckCheck className="size-4" />
        {allItemsSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
      </Button>

      <span className="font-medium text-muted-foreground">
        {hasSelection ? `تم تحديد ${selectedCount}` : 'لم يتم تحديد عناصر'}
      </span>

      <div className="ms-auto flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onCopy} disabled={!hasSelection}>
          <Copy className="size-4" />
          نسخ
        </Button>
        <Button type="button" size="sm" variant="destructive" onClick={onDelete} disabled={!hasSelection}>
          <Trash2 className="size-4" />
          حذف
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClearSelection} disabled={!hasSelection}>
          <X className="size-4" />
          إلغاء التحديد
        </Button>
      </div>
    </div>
  );
}
