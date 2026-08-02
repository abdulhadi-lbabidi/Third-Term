import { Building2, Calendar, FileText, Info } from 'lucide-react';
import type { Project, ProjectStatus } from '@/features/projects/types';

type ProjectMetadataSidebarProps = {
  project: Project;
  fundsCount: number;
  invoicesCount: number;
  revenuesCount: number;
  expensesCount: number;
};

export function ProjectMetadataSidebar({
  project,
  fundsCount,
  invoicesCount,
  revenuesCount,
  expensesCount,
}: ProjectMetadataSidebarProps) {
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

  const statusConf = getStatusConfig(project.status);

  return (
    <div className="space-y-3">
      <div className="bg-white border border-[#E7E9EF] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Info className="size-4 text-[#C9A84C]" />
          <h4 className="text-xs font-extrabold text-[#17182F] uppercase tracking-wider">
            معلومات المشروع العامة
          </h4>
        </div>

        <div className="space-y-3.5">
          <div className="flex items-start gap-2.5">
            <Building2 className="size-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] text-[#667085] block font-medium">القسم المسؤول</span>
              <span className="text-xs font-bold text-[#172033] block mt-0.5">
                {project.department?.name ?? 'غير محدد'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Calendar className="size-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] text-[#667085] block font-medium">تاريخ البدء</span>
              <span className="text-xs font-bold text-[#172033] block mt-0.5">
                {project.created_at ? new Date(project.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="size-4 rounded-full border border-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
              #
            </span>
            <div>
              <span className="text-[10px] text-[#667085] block font-medium">الحالة الحالية</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${statusConf.bg}`}>
                <span className={`size-1.5 rounded-full ${statusConf.dot}`} />
                {statusConf.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E7E9EF] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="size-4 text-[#C9A84C]" />
          <h4 className="text-xs font-extrabold text-[#17182F] uppercase tracking-wider">
            ملخص الحركات المالية
          </h4>
        </div>

        <div className="space-y-2.5 divide-y divide-slate-100">
          <div className="flex justify-between items-center text-xs py-1">
            <span className="text-[#667085]">إجمالي الصناديق</span>
            <span className="font-bold text-[#172033]">{fundsCount}</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2.5 py-1">
            <span className="text-[#667085]">الإيرادات المقيدة</span>
            <span className="font-bold text-emerald-600">{revenuesCount}</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2.5 py-1">
            <span className="text-[#667085]">المصروفات المقيدة</span>
            <span className="font-bold text-rose-600">{expensesCount}</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2.5 py-1">
            <span className="text-[#667085]">عدد الفواتير</span>
            <span className="font-bold text-blue-600">{invoicesCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
