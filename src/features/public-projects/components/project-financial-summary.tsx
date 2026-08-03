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
};

export function ProjectFinancialSummary({
  project,
  funds,
  selectedFundId,
  onSelectFund,
}: ProjectFinancialSummaryProps) {
  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return { label: 'مكتمل', bg: 'bg-emerald-50 text-emerald-800 border-emerald-100', dot: 'bg-emerald-500' };
      case 'in_progress':
        return { label: 'قيد التنفيذ', bg: 'bg-amber-50 text-amber-800 border-amber-100', dot: 'bg-amber-500' };
      case 'cancelled':
        return { label: 'ملغي', bg: 'bg-rose-50 text-rose-800 border-rose-100', dot: 'bg-rose-500' };
      default:
        return { label: 'قيد الانتظار', bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
    }
  };

  const formatNumber = (val: number | string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  const statusConf = getStatusConfig(project.status);

  return (
    <div className="bg-white border border-[#E7E9EF] rounded-xl shadow-xs overflow-hidden">
      <div className="h-[2px] w-full bg-gradient-to-r from-[#17182F] via-[#C9A84C] to-[#17182F]" />
      <div className="px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="border-r-4 border-[#C9A84C] pr-3 min-w-0">
            <span className="text-[9px] font-bold text-[#667085] block mb-0.5 uppercase tracking-wider">بوابة المشروع المالية</span>
            <h2 className="text-sm font-extrabold text-[#172033] leading-tight truncate">
              {project.name}
            </h2>
          </div>
          <span className={`w-fit shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConf.bg}`}>
            <span className={`size-1.5 rounded-full ${statusConf.dot}`} />
            {statusConf.label}
          </span>
        </div>

        {funds && funds.length > 1 && (
          <div className="flex items-center gap-2 shrink-0 lg:mx-auto">
            {funds.map((fund) => {
              const isSelected = selectedFundId === fund.id || (selectedFundId === null && fund.id === funds[0]?.id);
              return (
                <button
                  key={fund.id}
                  type="button"
                  onClick={() => onSelectFund(fund.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 border ${
                    isSelected
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

        <div className="flex items-center gap-6 text-xs shrink-0 bg-slate-50/50 px-4 py-2 rounded-lg border border-slate-100">
          <div className="text-center sm:text-start">
            <span className="text-[9px] text-[#667085] block font-medium">التكلفة المتوقعة</span>
            <span className="text-xs font-extrabold text-[#C9A84C] block mt-0.5">
              ${formatNumber(project.expected_cost)}
            </span>
          </div>
          {project.department && (
            <div className="border-r border-slate-200 pr-4 text-center sm:text-start">
              <span className="text-[9px] text-[#667085] block font-medium">القسم</span>
              <span className="text-xs font-bold text-[#172033] block mt-0.5">{project.department.name}</span>
            </div>
          )}
          <div className="border-r border-slate-200 pr-4 text-center sm:text-start">
            <span className="text-[9px] text-[#667085] block font-medium">تاريخ الإنشاء</span>
            <span className="text-xs font-semibold text-slate-650 block mt-0.5">
              {project.created_at ? new Date(project.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
