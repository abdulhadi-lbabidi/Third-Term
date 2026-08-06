import * as React from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { XIcon, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';

type FilterDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  onApply: () => void;
  onReset: () => void;
};

export function FilterDrawer({
  open,
  onOpenChange,
  title = 'تصفية متقدمة',
  children,
  onApply,
  onReset,
}: FilterDrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 isolate z-50 bg-black/25 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-card text-sm text-card-foreground shadow-[var(--shadow-finance-md)] outline-none duration-150",
            "data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right"
          )}
          dir="rtl"
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <SlidersHorizontal className="size-4" />
              <span>{title}</span>
            </div>
            <DialogPrimitive.Close
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <XIcon className="size-4" />
              <span className="sr-only">إغلاق</span>
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {children}
          </div>

          <div className="border-t border-border bg-muted/40 p-4 flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                onApply();
                onOpenChange(false);
              }}
            >
              تطبيق الفلترة
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onReset();
                onOpenChange(false);
              }}
            >
              إعادة ضبط
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
