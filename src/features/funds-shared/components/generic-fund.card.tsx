import { Banknote, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

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
  subtitle?: string;
  currencies: GenericFundCurrency[];
  createdAt?: string;
  onClick: (fundId: number) => void;
  onMoreCurrenciesClick?: (fundId: number) => void;
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

export function GenericFundCard({
  fundId,
  name,
  subtitle,
  currencies,
  onClick,
  onMoreCurrenciesClick,
}: GenericFundCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onClick(fundId)}
      className="group relative flex min-w-0 w-full cursor-pointer flex-col overflow-hidden transition-all hover:border-primary hover:shadow-md focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-200 to-slate-100 transition-colors group-hover:from-primary/70 group-hover:to-primary" />
      <CardContent className="flex flex-1 flex-col justify-between p-5 !py-0">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Wallet className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-foreground" title={name}>{name}</h3>
                <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
          </div>

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

        {/* <div className="flex size-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-sky-50 group-hover:text-sky-600">
          <ChevronLeft className="size-4" />
        </div> */}

        {/* <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          <span>تم الإنشاء:</span>
          <span>{createdAt ?? '-'}</span>
        </div> */}
      </CardContent>
    </Card>
  );
}
