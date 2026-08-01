import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Input } from './input';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type SearchableSelectOption = {
  value: number | string;
  label: string;
};

type SearchableSelectProps = {
  value: any;
  onValueChange: (value: any) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
  bottomAction?: React.ReactNode;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'اختر...',
  searchPlaceholder = 'ابحث...',
  emptyMessage = 'لا توجد نتائج.',
  className,
  disabled = false,
  multiple = false,
  bottomAction,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedArray = multiple ? (Array.isArray(value) ? value : []) : [];

  const selectedLabel = multiple
    ? selectedArray.length > 0
      ? selectedArray.length <= 2
        ? options.filter((o) => selectedArray.includes(o.value)).map((o) => o.label).join(', ')
        : `${selectedArray.length} عناصر محددة`
      : null
    : options.find((o) => o.value === value)?.label;

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
    if (open) setSearch('');
  };

  const handleSelect = (option: SearchableSelectOption) => {
    if (multiple) {
      const isSelected = selectedArray.includes(option.value);
      if (isSelected) {
        onValueChange(selectedArray.filter((v: any) => v !== option.value));
      } else {
        onValueChange([...selectedArray, option.value]);
      }
    } else {
      onValueChange(option.value);
      setOpen(false);
      setSearch('');
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <Button
        type="button"
        disabled={disabled}
        variant="ghost"
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center justify-between gap-2 h-auto min-h-9 px-3 py-2',
          'rounded-md border border-input bg-transparent text-sm font-normal shadow-sm',
          'transition-colors hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          (!multiple && !value) || (multiple && selectedArray.length === 0) ? 'text-muted-foreground' : '',
          className
        )}
      >
        <div className="flex flex-wrap gap-1 items-center flex-1 text-right truncate">
          {multiple && selectedArray.length > 0 && selectedArray.length <= 2 ? (
            options
              .filter((o) => selectedArray.includes(o.value))
              .map((o) => (
                <span key={o.value} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-medium">
                  {o.label}
                  <X
                    className="size-3 cursor-pointer hover:text-slate-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      onValueChange(selectedArray.filter((v: any) => v !== o.value));
                    }}
                  />
                </span>
              ))
          ) : (
            <span className="truncate">{selectedLabel ?? placeholder}</span>
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1.5',
            'rounded-md border bg-popover text-popover-foreground shadow-md outline-none',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          {/* Search */}
          <div className="p-1 border-b">
            <Input
              ref={inputRef}
              className="w-full text-sm outline-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                {emptyMessage}
              </p>
            )}
            {filtered.map((option) => {
              const isSelected = multiple ? selectedArray.includes(option.value) : option.value === value;
              return (
                <Button
                  key={option.value}
                  variant="ghost"
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'flex w-full items-center justify-start gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
                    'cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors',
                    isSelected && 'bg-accent text-accent-foreground font-medium'
                  )}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0 text-slate-900',
                      isSelected ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Bottom Action */}
          {bottomAction && (
            <div className="p-1 border-t bg-muted/30">
              {bottomAction}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
