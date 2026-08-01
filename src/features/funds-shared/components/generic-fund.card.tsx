import { Banknote, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';

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
  subtitle: string;
  currencies: GenericFundCurrency[];
  createdAt?: string;
  onClick: (fundId: number) => void;
  onMoreCurrenciesClick?: (fundId: number) => void;
};

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
      className="group relative flex cursor-pointer flex-col overflow-hidden transition-all hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-200 to-slate-100 transition-colors group-hover:from-sky-400 group-hover:to-blue-500" />
      <CardContent className="flex flex-1 flex-col justify-between p-5 !py-0">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-sky-50 group-hover:text-sky-600">
                <Wallet className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{name}</h3>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
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
