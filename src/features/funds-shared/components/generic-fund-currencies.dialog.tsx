import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import type { GenericFundCurrency } from './generic-fund.card';

export type GenericFundWithCurrencies<T = any> = {
  id: number;
  name: string;
  currencies?: GenericFundCurrency[];
} & T;

type GenericFundCurrenciesDialogProps<T = any> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fund: GenericFundWithCurrencies<T> | null;
  onCurrencyClick?: (fund: GenericFundWithCurrencies<T>, currencyId: number) => void;
  titlePrefix?: string;
};

export function GenericFundCurrenciesDialog<T = any>({
  open,
  onOpenChange,
  fund,
  onCurrencyClick,
  titlePrefix = 'عملات',
}: GenericFundCurrenciesDialogProps<T>) {
  const currencies = fund?.currencies ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{titlePrefix} {fund?.name || 'الصندوق'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {currencies.length ? (
            currencies.map((currency) => (
              <button
                key={currency.id}
                type="button"
                onClick={() => fund && onCurrencyClick?.(fund, currency.id)}
                className="flex w-full items-center justify-between rounded-xl border bg-slate-50 px-4 py-3 text-start transition-colors hover:bg-slate-100"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900">
                    {currency.currency} {currency.symbol}
                  </div>
                  <div className="text-sm text-slate-500">تاريخ الإضافة: {currency.created_at ?? '-'}</div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-500">الرصيد</div>
                  <div className="text-lg font-semibold text-slate-900">{currency.balance}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-xl border border-dashed bg-slate-50 px-4 py-8 text-center text-slate-500">
              لا توجد عملات مرتبطة بهذا الصندوق
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
