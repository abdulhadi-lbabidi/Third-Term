import { Building2, ChevronLeft } from 'lucide-react';
import type { Project, ProjectStatus } from '@/features/projects/types';

type ProjectCardProps = {
  project: Project;
  onSelect: (id: number) => void;
};

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
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
    <div
      onClick={() => onSelect(project.id)}
      className="group relative bg-white border border-[#E7E9EF] rounded-xl overflow-hidden cursor-pointer hover:border-[#C9A84C]/50 hover:shadow-md hover:translate-y-[-2px] transition-all duration-200 flex flex-col justify-between"
    >
      <div className="h-[2px] w-full bg-[#17182F]" />
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2.5 mb-3">
            <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold border ${statusConf.bg}`}>
              <span className={`size-1.5 rounded-full ${statusConf.dot}`} />
              {statusConf.label}
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#172033] leading-snug group-hover:text-[#C9A84C] transition-colors line-clamp-2 mb-2">
            {project.name}
          </h3>
          {project.department && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#667085] font-medium mb-4">
              <Building2 className="size-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{project.department.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <div>
            <span className="text-[9px] text-[#667085] block font-medium">التكلفة المتوقعة</span>
            <span className="text-sm font-extrabold text-[#17182F]">
              ${formatNumber(project.expected_cost)}
            </span>
          </div>
          <span className="text-xs font-bold text-[#C9A84C] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
            التفاصيل
            <ChevronLeft className="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
