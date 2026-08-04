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
    return new Intl.NumberFormat('en-US').format(num);
  };

  const netBalance = totalRevenues - totalExpenses;

  const cards = [
    {
      icon: DollarSign,
      label: 'الميزانية المتوقعة',
      value: `${formatNumber(expectedCost)}`,
      badgeVariant: 'secondary',
      bgClass: 'bg-muted text-muted-foreground',
    },
    {
      icon: TrendingUp,
      label: 'إجمالي الإيرادات',
      value: `+${formatNumber(totalRevenues)}`,
      badgeVariant: 'success',
      bgClass: 'bg-success/10 text-success border border-success/20',
    },
    {
      icon: TrendingDown,
      label: 'إجمالي المصروفات',
      value: `-${formatNumber(totalExpenses)}`,
      badgeVariant: 'destructive',
      bgClass: 'bg-destructive/10 text-destructive border border-destructive/20',
    },
    {
      icon: Wallet,
      label: 'صافي الرصيد الحالي',
      value: `${netBalance >= 0 ? '+' : ''}${formatNumber(netBalance)}`,
      badgeVariant: netBalance >= 0 ? 'success' : 'destructive',
      bgClass: netBalance >= 0 ? 'bg-success/10 text-success border border-success/20' : 'bg-destructive/10 text-destructive border border-destructive/20',
    },
    {
      icon: FileText,
      label: 'عدد الفواتير',
      value: invoicesCount,
      badgeVariant: 'info',
      bgClass: 'bg-primary/10 text-primary border border-primary/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-card border border-border rounded-lg p-3.5 shadow-finance flex items-center justify-between min-w-0"
        >
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold block leading-none">{card.label}</span>
            <span className="text-base sm:text-lg font-bold text-foreground block font-mono leading-none pt-1">
              {card.value}
            </span>
          </div>
          <div className={`p-2 rounded-lg shrink-0 ${card.bgClass}`}>
            <card.icon className="size-4 sm:size-5 text-current" />
          </div>
        </div>
      ))}
    </div>
  );
}
