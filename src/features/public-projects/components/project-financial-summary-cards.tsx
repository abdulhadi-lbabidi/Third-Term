import { DollarSign, TrendingUp, TrendingDown, Wallet, FileText } from 'lucide-react';

type ProjectFinancialSummaryCardsProps = {
  expectedCost: number | string;
  totalRevenues: number;
  totalExpenses: number;
  invoicesCount: number;
};

export function ProjectFinancialSummaryCards({
  expectedCost,
  totalRevenues,
  totalExpenses,
  invoicesCount,
}: ProjectFinancialSummaryCardsProps) {
  const formatNumber = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  const netBalance = totalRevenues - totalExpenses;

  const cards = [
    {
      icon: DollarSign,
      label: 'الميزانية المتوقعة',
      value: `${formatNumber(expectedCost)}`,
      textClass: 'text-[#172033]',
      bgClass: 'bg-slate-50 text-slate-500',
    },
    {
      icon: TrendingUp,
      label: 'إجمالي الإيرادات',
      value: `+${formatNumber(totalRevenues)}`,
      textClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    {
      icon: TrendingDown,
      label: 'إجمالي المصروفات',
      value: `-${formatNumber(totalExpenses)}`,
      textClass: 'text-rose-600',
      bgClass: 'bg-rose-50 text-rose-600 border border-rose-100',
    },
    {
      icon: Wallet,
      label: 'صافي الرصيد الحالي',
      value: `${netBalance >= 0 ? '+' : ''}${formatNumber(netBalance)}`,
      textClass: netBalance >= 0 ? 'text-blue-600' : 'text-rose-600',
      bgClass: 'bg-blue-50 text-blue-600 border border-blue-100',
    },
    {
      icon: FileText,
      label: 'عدد الفواتير',
      value: invoicesCount,
      textClass: 'text-purple-600',
      bgClass: 'bg-purple-50 text-purple-600 border border-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white border border-[#E7E9EF] rounded-xl p-4 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#667085] font-bold leading-none">{card.label}</span>
            <div className={`p-1.5 rounded-lg shrink-0 ${card.bgClass}`}>
              <card.icon className="size-3.5 text-current" />
            </div>
          </div>
          <p className={`text-base sm:text-lg font-extrabold mt-3 leading-none ${card.textClass}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
