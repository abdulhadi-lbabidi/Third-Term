import type { ReactNode } from 'react';
import { RotateCcw, Search, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/ui/select';

export type FundSortOption = {
  value: string;
  label: string;
};

type FundsListToolbarProps = {
  title: string;
  icon: ReactNode;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  sort: string;
  onSortChange: (value: string) => void;
  sortOptions: FundSortOption[];
  onReset: () => void;
  onCreate?: () => void;
  createLabel?: string;
  total?: number;
};

export function FundsListToolbar({
  title,
  icon,
  search,
  onSearchChange,
  searchPlaceholder,
  sort,
  onSortChange,
  sortOptions,
  onReset,
  onCreate,
  createLabel,
  total,
}: FundsListToolbarProps) {
  const hasFilters = Boolean(search) || sort !== sortOptions[0]?.value;

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 items-center gap-3 xl:me-auto">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h2>
            {typeof total === 'number' ? (
              <p className="text-xs text-muted-foreground">{total} صندوق</p>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center xl:justify-end">
          <div className="relative min-w-0 flex-1 sm:min-w-64 xl:w-72 xl:flex-none">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="pe-9 ps-9"
              aria-label={searchPlaceholder}
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute end-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="مسح البحث"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <Select value={sort} onValueChange={(value) => onSortChange(value ?? sortOptions[0]?.value)}>
              <SelectTrigger className="min-w-0 flex-1 sm:w-48 sm:flex-none">
                {sortOptions.find((option) => option.value === sort)?.label ?? 'ترتيب النتائج'}
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters ? (
              <Button type="button" variant="outline" size="icon" onClick={onReset} title="إعادة ضبط البحث والترتيب">
                <RotateCcw className="size-4" />
              </Button>
            ) : null}

            {onCreate && createLabel ? (
              <Button type="button" size="sm" onClick={onCreate} className="shrink-0 whitespace-nowrap">
                {createLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
