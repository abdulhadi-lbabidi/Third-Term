import { FolderKanban, DollarSign, Clock, CheckCircle2 } from 'lucide-react';

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
      text: 'text-foreground',
    },
    {
      icon: DollarSign,
      label: 'إجمالي قيمة التكاليف المتوقعة',
      value: `$${formatNumber(totalCost)}`,
      bg: 'bg-success/10 text-success border border-success/20',
      text: 'text-success',
    },
    {
      icon: Clock,
      label: 'مشاريع قيد التنفيذ',
      value: inProgressCount,
      bg: 'bg-info/10 text-info border border-info/20',
      text: 'text-info',
    },
    {
      icon: CheckCircle2,
      label: 'مشاريع مكتملة',
      value: completedCount,
      bg: 'bg-success/10 text-success border border-success/20',
      text: 'text-success',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between shadow-finance hover:shadow-finance-md transition-all duration-200"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground font-semibold leading-none">{item.label}</span>
            <div className={`p-2 rounded-md shrink-0 ${item.bg}`}>
              <item.icon className="size-4 text-current" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-bold mt-4 leading-none tracking-tight font-mono ${item.text}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
