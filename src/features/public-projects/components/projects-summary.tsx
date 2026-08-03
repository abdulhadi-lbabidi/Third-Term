import { FolderKanban, DollarSign, Clock, CheckCircle2 } from 'lucide-react';

type ProjectsSummaryProps = {
  total: number;
  totalCost: number;
  inProgressCount: number;
  completedCount: number;
};

export function ProjectsSummary({ total, totalCost, inProgressCount, completedCount }: ProjectsSummaryProps) {
  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('ar-SA').format(val);
  };

  const statItems = [
    {
      icon: FolderKanban,
      label: 'إجمالي المشاريع',
      value: total,
      bg: 'bg-slate-50 text-slate-700',
      border: 'border-t-2 border-t-slate-400',
    },
    {
      icon: DollarSign,
      label: 'إجمالي قيمة التكاليف المتوقعة',
      value: `$${formatNumber(totalCost)}`,
      bg: 'bg-emerald-50/50 text-emerald-700',
      border: 'border-t-2 border-t-emerald-500',
    },
    {
      icon: Clock,
      label: 'مشاريع قيد التنفيذ',
      value: inProgressCount,
      bg: 'bg-amber-50/50 text-amber-700',
      border: 'border-t-2 border-t-amber-500',
    },
    {
      icon: CheckCircle2,
      label: 'مشاريع مكتملة',
      value: completedCount,
      bg: 'bg-purple-50/50 text-purple-700',
      border: 'border-t-2 border-t-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <div
          key={index}
          className={`bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm border border-[#E7E9EF] transition-all hover:translate-y-[-1px] hover:shadow-md ${item.border}`}
        >
          <div className={`p-2.5 rounded-lg shrink-0 ${item.bg}`}>
            <item.icon className="size-5 text-current" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-[#667085] font-medium leading-none">{item.label}</p>
            <p className="text-xl sm:text-2xl font-extrabold text-[#172033] mt-1.5 leading-none">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
