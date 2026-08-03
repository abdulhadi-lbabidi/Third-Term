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
  onSelectFund: (id: number) => void;
};

export function ProjectFundsSection({ funds, selectedFundId, onSelectFund }: ProjectFundsSectionProps) {
  const activeFund = funds.find((f) => f.id === selectedFundId) || funds[0];

  return (
    <div className="bg-white border border-[#E7E9EF] rounded-xl p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="size-4 text-[#C9A84C]" />
        <h4 className="text-xs font-extrabold text-[#17182F] uppercase tracking-wider">
          صناديق المشروع المالية
        </h4>
        <span className="ms-auto text-[10px] text-[#667085] bg-slate-100 px-2 py-0.5 rounded-full font-bold">
          {funds.length} صناديق
        </span>
      </div>

      {funds.length === 0 ? (
        <FinancialEmptyState
          icon={Wallet}
          title="لا تتوفر صناديق مالية حالياً"
          description="لم يتم تخصيص صناديق مالية مشتركة لهذا المشروع بعد."
        />
      ) : (
        <div className="space-y-5">
          {funds.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
              {funds.map((fund) => {
                const isSelected = activeFund?.id === fund.id;
                return (
                  <button
                    key={fund.id}
                    type="button"
                    onClick={() => onSelectFund(fund.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border ${isSelected
                        ? 'bg-[#17182F] text-[#C9A84C] border-[#17182F]'
                        : 'bg-white text-[#667085] border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    {fund.name}
                  </button>
                );
              })}
            </div>
          )}

          {activeFund && (
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
                <div className="text-xs text-[#667085] text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  لا توجد عملات مهيأة في هذا الصندوق حالياً.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
