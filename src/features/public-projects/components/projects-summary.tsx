import { FolderKanban, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';

type ProjectsSummaryProps = {
  total: number;
  totalCost: number;
  inProgressCount: number;
  completedCount: number;
};

export function ProjectsSummary({ total, totalCost, inProgressCount, completedCount }: ProjectsSummaryProps) {
  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  const statItems = [
    {
      icon: FolderKanban,
      label: 'إجمالي المشاريع',
      value: total,
      bg: 'bg-muted text-muted-foreground',
      badgeVariant: 'secondary' as const,
    },
    {
      icon: DollarSign,
      label: 'إجمالي التكلفة المتوقعة',
      value: `$${formatNumber(totalCost)}`,
      bg: 'bg-success/10 text-success border border-success/20',
      badgeVariant: 'success' as const,
    },
    {
      icon: Clock,
      label: 'مشاريع قيد التنفيذ',
      value: inProgressCount,
      bg: 'bg-info/10 text-info border border-info/20',
      badgeVariant: 'info' as const,
    },
    {
      icon: CheckCircle2,
      label: 'مشاريع مكتملة',
      value: completedCount,
      bg: 'bg-success/10 text-success border border-success/20',
      badgeVariant: 'success' as const,
    },
  ];

  return (
    <div className="max-sm:grid  grid-cols-2 flex justify-center gap-2 w-full max-w-4xl mx-auto">
      {statItems.map((item, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-lg p-2.5 shadow-finance flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={`p-1 rounded shrink-0 ${item.bg}`}>
              <item.icon className="size-3.5 text-current" />
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold whitespace-nowrap" title={item.label}>
              {item.label}
            </span>
          </div>
          <div className="flex justify-end shrink-0">
            <Badge variant={item.badgeVariant} className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 truncate">
              {item.value}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
