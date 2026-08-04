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
        return { label: 'مكتمل', className: 'status-badge-success' };
      case 'in_progress':
        return { label: 'قيد التنفيذ', className: 'status-badge-info' };
      case 'cancelled':
        return { label: 'ملغي', className: 'status-badge-danger' };
      default:
        return { label: 'قيد الانتظار', className: 'status-badge-warning' };
    }
  };

  const statusConf = getStatusConfig(project.status);

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-lg p-5 shadow-finance space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Info className="size-4 text-accent-gold" />
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            معلومات المشروع العامة
          </h4>
        </div>

        <div className="space-y-3.5">
          <div className="flex items-start gap-2.5">
            <Building2 className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">القسم المسؤول</span>
              <span className="text-xs font-semibold text-foreground block mt-0.5">
                {project.department?.name ?? 'غير محدد'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Calendar className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">تاريخ البدء</span>
              <span className="text-xs font-semibold text-foreground block mt-0.5">
                {project.created_at ? new Date(project.created_at).toLocaleDateString('en-US') : 'غير محدد'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="size-4 rounded-full border border-border flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
              #
            </span>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">الحالة الحالية</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border mt-1 status-badge ${statusConf.className}`}>
                {statusConf.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 shadow-finance space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <FileText className="size-4 text-accent-gold" />
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            ملخص الحركات المالية
          </h4>
        </div>

        <div className="space-y-2.5 divide-y divide-border">
          <div className="flex justify-between items-center text-xs py-1">
            <span className="text-muted-foreground">إجمالي الصناديق</span>
            <span className="font-bold text-foreground">{fundsCount}</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2.5 py-1">
            <span className="text-muted-foreground">الإيرادات المقيدة</span>
            <span className="font-bold text-success">{revenuesCount}</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2.5 py-1">
            <span className="text-muted-foreground">المصروفات المقيدة</span>
            <span className="font-bold text-destructive">{expensesCount}</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2.5 py-1">
            <span className="text-muted-foreground">عدد الفواتير</span>
            <span className="font-bold text-primary">{invoicesCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
