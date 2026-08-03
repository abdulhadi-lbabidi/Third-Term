import { Wallet } from 'lucide-react';
import { CurrencyBalanceCard } from './currency-balance-card';
import { FinancialEmptyState } from './financial-empty-state';

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
};

export function ProjectFundsSection({ funds, selectedFundId }: ProjectFundsSectionProps) {
  const activeFund = funds.find((f) => f.id === selectedFundId) || funds[0];

  if (funds.length === 0) {
    return (
      <div className="bg-white border border-[#E7E9EF] rounded-xl p-5 shadow-xs">
        <FinancialEmptyState
          icon={Wallet}
          title="لا تتوفر صناديق مالية حالياً"
          description="لم يتم تخصيص صناديق مالية مشتركة لهذا المشروع بعد."
        />
      </div>
    );
  }

  if (!activeFund) return null;

  return (
    <div>
      {activeFund.currencies && activeFund.currencies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {activeFund.currencies.map((curr, idx) => (
            <CurrencyBalanceCard
              key={curr.id}
              currency={curr.currency}
              balance={curr.balance}
              symbol={curr.symbol}
              isPrimary={idx === 0}
            />
          ))}
        </div>
      ) : (
        <div className="text-xs text-[#667085] text-center py-6 bg-white border border-[#E7E9EF] rounded-xl shadow-xs">
          لا توجد عملات مهيأة في هذا الصندوق حالياً.
        </div>
      )}
    </div>
  );
}
