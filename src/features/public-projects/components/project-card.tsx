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
        return { label: 'مكتمل', className: 'status-badge-success' };
      case 'in_progress':
        return { label: 'قيد التنفيذ', className: 'status-badge-info' };
      case 'canceled':
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

  return (
    <div
      onClick={() => onSelect(project.id)}
      className="group relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover:border-accent-gold/50 hover:shadow-finance-md hover:translate-y-[-2px] transition-all duration-200 flex flex-col justify-between"
    >
      <div className="h-[2px] w-full bg-primary" />
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2.5 mb-3">
            <span className={`shrink-0 status-badge ${statusConf.className}`}>
              {statusConf.label}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-accent-gold transition-colors line-clamp-2 mb-2">
            {project.name}
          </h3>
          {project.department && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mb-4">
              <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{project.department.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
          <div>
            <span className="text-[9px] text-muted-foreground block font-medium">التكلفة المتوقعة</span>
            <span className="text-sm font-bold font-mono text-foreground">
              ${formatNumber(project.expected_cost)}
            </span>
          </div>
          <span className="text-xs font-semibold text-accent-gold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
            التفاصيل
            <ChevronLeft className="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
