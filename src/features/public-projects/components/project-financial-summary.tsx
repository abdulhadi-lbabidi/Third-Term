import { DollarSign, TrendingUp, TrendingDown, Wallet, FileText } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import type { Project, ProjectStatus } from '@/features/projects/types';

type ProjectFund = {
  id: number;
  name: string;
};

type ProjectFinancialSummaryProps = {
  project: Project;
  funds: ProjectFund[];
  selectedFundId: number | null;
  onSelectFund: (id: number) => void;
  totalRevenues: number;
  totalExpenses: number;
  invoicesCount: number;
};

export function ProjectFinancialSummary({
  project,
  funds,
  selectedFundId,
  onSelectFund,
  totalRevenues,
  totalExpenses,
  invoicesCount,
}: ProjectFinancialSummaryProps) {
  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return { label: 'مكتمل', className: 'status-badge-success' };
      case 'in_progress':
        return { label: 'قيد التنفيذ', className: 'status-badge-info' };
      case 'cancelled':
        return { label: 'ملغي', className: 'status-badge-danger' };
      default:
        return { label: 'قيد الانتظار', className: 'status-badge-warning' };
    }
  };

  const formatNumber = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-US').format(num);
  };

  const statusConf = getStatusConfig(project.status);
  const netBalance = totalRevenues - totalExpenses;

  const cards = [
    {
      icon: DollarSign,
      label: 'الميزانية المتوقعة',
      value: `${formatNumber(project.expected_cost)}`,
      badgeVariant: 'secondary',
      bgClass: 'bg-card text-muted-foreground',
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
    <div className="bg-card border border-border rounded-lg shadow-finance overflow-hidden">
      <div className="h-[2px] w-full bg-accent-gold" />
      <div className="px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="border-r-4 border-accent-gold pr-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground mb-1">
            <span className="font-bold uppercase tracking-wider">بوابة المشروع المالية</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-semibold text-foreground leading-tight truncate">
              {project.name}
            </h2>
            <span className={`w-fit shrink-0 status-badge ${statusConf.className}`}>
              {statusConf.label}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-muted border border-border rounded-lg px-2.5 py-1.5 shadow-finance flex items-center gap-2 min-w-0"
            >
              <div className={`p-1 rounded shrink-0 ${card.bgClass}`}>
                <card.icon className="size-3 text-current" />
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold shrink-0">{card.label}</span>
              <Badge variant={card.badgeVariant as any} className="text-[10px] font-mono font-bold px-1.5 py-0">
                {card.value}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
