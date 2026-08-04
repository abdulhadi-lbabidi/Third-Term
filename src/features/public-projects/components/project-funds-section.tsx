import { Wallet } from 'lucide-react';
import { FinancialEmptyState } from './financial-empty-state';
import { Badge } from '@/shared/components/ui/badge';

type ProjectFundCurrency = {
  id: number;
  currency: string;
  symbol: string;
  balance: string | number;
};

type ProjectFund = {
  id: number;
  name: string;
  currencies?: ProjectFundCurrency[];
};

type ProjectFundsSectionProps = {
  funds: ProjectFund[];
  selectedFundId: number | null;
  onSelectFund: (id: number) => void;
};

export function ProjectFundsSection({ funds, selectedFundId, onSelectFund }: ProjectFundsSectionProps) {
  const formatNumber = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (funds.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 shadow-finance">
        <FinancialEmptyState
          icon={Wallet}
          title="لا تتوفر صناديق مالية حالياً"
          description="لم يتم تخصيص صناديق مالية مشتركة لهذا المشروع بعد."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {funds.map((fund) => {
        const isSelected = selectedFundId === fund.id || (selectedFundId === null && fund.id === funds[0]?.id);
        return (
          <div
            key={fund.id}
            onClick={() => onSelectFund(fund.id)}
            className={`p-2.5 rounded-lg border cursor-pointer transition-all flex flex-col gap-2 shadow-finance w-full sm:w-[320px] ${
              isSelected
                ? 'border-accent-gold bg-accent-gold/5'
                : 'border-border bg-card hover:bg-muted/40 hover:border-border'
            }`}
          >
            <div className="flex items-center justify-between min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Wallet className={`size-3.5 shrink-0 ${isSelected ? 'text-accent-gold' : 'text-muted-foreground'}`} />
                <span className="text-xs font-semibold text-foreground truncate">{fund.name}</span>
              </div>
              {isSelected && (
                <span className="shrink-0 text-[8px] bg-accent-gold text-white px-1.5 py-0.5 rounded font-bold">نشط</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border/40">
              {fund.currencies && fund.currencies.length > 0 ? (
                fund.currencies.map((curr) => (
                  <Badge
                    key={curr.id}
                    variant={isSelected ? 'default' : 'secondary'}
                    className="text-[10px] font-mono font-bold flex items-baseline gap-0.5 px-1.5 py-0"
                  >
                    {formatNumber(curr.balance)}
                    <span className="text-[9px] font-sans font-medium opacity-80">{curr.symbol}</span>
                  </Badge>
                ))
              ) : (
                <span className="text-[9px] text-muted-foreground">لا توجد عملات</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
