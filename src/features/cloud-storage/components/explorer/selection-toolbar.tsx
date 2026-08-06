import type { ComponentType } from 'react';
import { ClipboardPaste, Copy, Loader2, LogOut, Scissors, Trash2, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';

interface SelectionToolbarProps {
  selectedCount: number;
  hasItems: boolean;
  allItemsSelected: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onExitClipboard: () => void;
  onCopy: () => void;
  onCut: () => void;
  clipboardCount: number;
  onPaste: () => void;
  isPasting: boolean;
  onDelete: () => void;
}

interface ActionButtonProps {
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  destructive?: boolean;
  loading?: boolean;
}

function ActionButton({ label, icon: Icon, onClick, disabled, active, destructive, loading }: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          <Button
            type="button"
            size="icon-sm"
            variant={active ? 'secondary' : 'ghost'}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className={destructive ? 'text-destructive hover:bg-destructive/10 hover:text-destructive' : undefined}
          />
        )}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function SelectionToolbar({
  selectedCount,
  hasItems,
  allItemsSelected,
  onToggleSelectAll,
  onClearSelection,
  onExitClipboard,
  onCopy,
  onCut,
  clipboardCount,
  onPaste,
  isPasting,
  onDelete,
}: SelectionToolbarProps) {
  const hasSelection = selectedCount > 0;
  const isClipboardMode = clipboardCount > 0;
  const actionsLocked = isClipboardMode || isPasting;

  return (
    <TooltipProvider>
      <div className="flex min-w-fit items-center gap-1 text-sm">
        <Tooltip>
          <TooltipTrigger render={<span className="mx-2 inline-flex" />}>
            <Checkbox
              checked={allItemsSelected}
              onCheckedChange={onToggleSelectAll}
              disabled={!hasItems || actionsLocked}
              aria-label={allItemsSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
              className="size-5"
            />
          </TooltipTrigger>
          <TooltipContent>{allItemsSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</TooltipContent>
        </Tooltip>
        <span className="mx-1 font-medium text-muted-foreground">{hasSelection ? `تم تحديد ${selectedCount}` : 'لم يتم تحديد عناصر'}</span>
        <div className="ms-auto flex flex-wrap gap-1">
          <ActionButton label="نسخ" icon={Copy} onClick={onCopy} disabled={!hasSelection || actionsLocked} />
          <ActionButton label="قص" icon={Scissors} onClick={onCut} disabled={!hasSelection || actionsLocked} />
          <ActionButton label={clipboardCount ? `لصق ${clipboardCount} عنصر` : 'لصق'} icon={ClipboardPaste} onClick={onPaste} disabled={!clipboardCount || isPasting} loading={isPasting} />
          <ActionButton label="حذف" icon={Trash2} onClick={onDelete} disabled={!hasSelection || actionsLocked} destructive />
          <ActionButton
            label={isClipboardMode ? 'الخروج من وضع النسخ أو القص' : 'إلغاء التحديد'}
            icon={isClipboardMode ? LogOut : X}
            onClick={isClipboardMode ? onExitClipboard : onClearSelection}
            disabled={isPasting || (!isClipboardMode && !hasSelection)}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
