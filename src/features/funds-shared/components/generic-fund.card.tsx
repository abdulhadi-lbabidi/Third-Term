import { Wallet, Banknote, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Button } from '@/shared/components/ui/button';
import { formatArabicDate, cn } from '@/shared/lib/utils';

export type GenericFundCurrency = {
  id: number;
  currency: string;
  symbol: string;
  balance: string | number;
  created_at?: string;
};

type GenericFundCardProps = {
  fundId: number;
  name: string;
  currencies: GenericFundCurrency[];
  created_at?: string;
  status?: 'pending' | 'complete' | 'canceled';
  description?: string;
  threshold?: number;
  type?: string;
  onClick: (fundId: number) => void;
  onMoreCurrenciesClick?: (fundId: number) => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function GenericFundCardSkeleton() {
  return (
    <Card className="relative flex flex-col overflow-hidden">
      <Skeleton className="absolute inset-x-0 top-0 h-1 rounded-none" />
      <CardContent className="flex flex-1 flex-col justify-between p-5 !py-0">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-24 rounded-md" />
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const statusLabels = {
  pending: { label: 'قيد العمل', className: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  complete: { label: 'مكتمل', className: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  canceled: { label: 'منتهي', className: 'bg-rose-50 text-rose-700 border-rose-200/60' },
};

export function GenericFundCard({
  fundId,
  name,
  currencies,
  created_at,
  status,
  description,
  threshold,
  type,
  onClick,
  onMoreCurrenciesClick,
  onEdit,
  onDelete,
}: GenericFundCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onClick(fundId)}
      className="group relative flex min-w-0 w-full flex-col overflow-hidden transition-all focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 cursor-pointer hover:border-primary hover:shadow-md"
    >
      <div className="absolute inset-x-0 top-0 h-1 transition-colors bg-gradient-to-r from-slate-200 to-slate-100 group-hover:from-primary/70 group-hover:to-primary" />
      <CardContent className="flex flex-1 flex-col justify-between p-5 !py-0">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Wallet className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="truncate font-semibold text-foreground" title={name}>{name}</h3>
                  {type && (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200/80">
                      {type}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 shrink-0">
              <div className="flex flex-col items-end gap-1.5">
                {status && (
                  <span className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                    statusLabels[status]?.className
                  )}>
                    {statusLabels[status]?.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          {description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-normal leading-relaxed" title={description}>
              {description}
            </p>
          )}

          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              الأرصدة المتوفرة
            </p>
            {!currencies.length ? (
              <div className="flex items-center gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50 p-2 text-xs text-slate-400">
                <Banknote className="size-3.5" />
                <span>لا يوجد عملات مرفقة</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currencies.slice(0, 3).map((currency) => (
                  <button
                    key={currency.id}
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md border border-sky-100 bg-sky-50/50 px-2.5 py-1 text-sm font-medium text-sky-900 transition-colors hover:bg-sky-100"
                  >
                    <span>
                      {currency.currency} {currency.symbol}
                    </span>
                    <span className="text-[11px] text-sky-700/80">({currency.balance})</span>
                  </button>
                ))}
                {currencies.length > 3 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoreCurrenciesClick?.(fundId);
                    }}
                    className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    +{currencies.length - 3} المزيد
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>الحد الأدنى للرصيد:</span>
          <span className="font-semibold text-slate-700">{threshold ?? 0}</span>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>تاريخ الإنشاء:</span>
            <span className="font-semibold text-slate-700">{created_at ? formatArabicDate(created_at) : '-'}</span>
          </div>
          <div>
            {(onEdit || (onDelete && status !== 'canceled')) && (
              <div className="flex items-center gap-1 border border-slate-200/60 rounded-lg p-0.5 bg-slate-50/50">
                {onEdit && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                )}
                {onDelete && status !== 'canceled' && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
