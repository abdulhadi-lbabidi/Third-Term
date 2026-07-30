import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Input } from './input';

export type SearchableSelectOption = {
  value: number | string;
  label: string;
};

export type InlineSearchableSelectProps = {
  value: any;
  onValueChange: (value: any) => void;
  options: SearchableSelectOption[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
};

export function InlineSearchableSelect({
  value,
  onValueChange,
  options,
  searchPlaceholder = 'ابحث...',
  emptyMessage = 'لا توجد نتائج.',
  className,
  disabled = false,
  multiple = false,
}: InlineSearchableSelectProps) {
  const [search, setSearch] = useState('');

  const selectedArray = multiple ? (Array.isArray(value) ? value : []) : [];

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (option: SearchableSelectOption) => {
    if (disabled) return;

    if (multiple) {
      const isSelected = selectedArray.includes(option.value);
      if (isSelected) {
        onValueChange(selectedArray.filter((v: any) => v !== option.value));
      } else {
        onValueChange([...selectedArray, option.value]);
      }
    } else {
      onValueChange(option.value);
    }
  };

  return (
    <div
      className={cn(
        'w-full rounded-md border bg-card text-card-foreground shadow-sm flex flex-col',
        className
      )}
    >
      {/* Selected Chips */}
      {multiple && selectedArray.length > 0 && (
        <div className="p-2 border-b shrink-0 flex flex-wrap gap-1 max-h-32 overflow-y-auto">
          {options
            .filter((o) => selectedArray.includes(o.value))
            .map((o) => (
              <span
                key={o.value}
                className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-medium"
              >
                {o.label}
                <X
                  className="size-3 cursor-pointer hover:text-slate-900"
                  onClick={(e) => {
                    e.stopPropagation();
                    onValueChange(selectedArray.filter((v: any) => v !== o.value));
                  }}
                />
              </span>
            ))}
        </div>
      )}

      {/* Search */}
      <div className="p-1 border-b shrink-0">
        <Input
          className="w-full text-sm outline-none border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={disabled}
        />
      </div>

      {/* Options */}
      <div className="max-h-36 overflow-y-auto p-1 flex-1">
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
              disabled={disabled}
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
    </div>
  );
}
