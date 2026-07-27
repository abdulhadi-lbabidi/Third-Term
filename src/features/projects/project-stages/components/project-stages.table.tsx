import { DataTable } from '@/features/components/data-table';
import { Plus, ListTree } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { ProjectStage } from '../project-stages.types';
import type { StageTimeline } from '../../stage-timelines/stage-timelines.types';
import { formatArabicDate } from '@/shared/lib/utils';

type ProjectStagesTableProps = {
  data: ProjectStage[];
  loading?: boolean;
  onEdit: (stage: ProjectStage) => void;
  onDelete: (stage: ProjectStage) => void;
  onAddTimeline: (stage: ProjectStage) => void;
  onEditTimeline: (timeline: StageTimeline, stage: ProjectStage) => void;
  onDeleteTimeline: (timeline: StageTimeline, stage: ProjectStage) => void;
};

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-slate-100 text-slate-800' },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'ملغى', color: 'bg-red-100 text-red-800' },
};

export function ProjectStagesTable({
  data,
  loading,
  onEdit,
  onDelete,
  onAddTimeline,
  onEditTimeline,
  onDeleteTimeline,
}: ProjectStagesTableProps) {
  const columns = [
    {
      header: 'المرحلة',
      cell: (row: ProjectStage) => (
        <div className="font-medium text-slate-900">{row.name}</div>
      ),
    },
    {
      header: 'تاريخ البدء',
      cell: (row: ProjectStage) => (
        <div className="text-sm">{row.start_date}</div>
      ),
    },
    {
      header: 'تاريخ الانتهاء المتوقع',
      cell: (row: ProjectStage) => (
        <div className="text-sm">{row.expected_end_date}</div>
      ),
    },
    {
      header: 'نسبة الإنجاز',
      cell: (row: ProjectStage) => (
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium w-8">{row.stage_progress}%</div>
          <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-slate-900 transition-all"
              style={{ width: `${row.stage_progress}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'الحالة',
      cell: (row: ProjectStage) => {
        const statusObj = statusMap[row.status as string] || { label: row.status, color: 'bg-slate-100 text-slate-800' };
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusObj.color}`}>
            {statusObj.label}
          </span>
        );
      },
    },
  ];

  const renderExpandedRow = (stage: ProjectStage) => {
    const timelines = stage.timelines ?? [];
    return (
      <div className="p-4 pl-12 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 text-slate-700">
            <ListTree className="size-4" />
            <h4 className="text-sm font-semibold">التفاصيل الزمنية والتحديثات</h4>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => onAddTimeline(stage)}
          >
            <Plus className="size-3" />
            إضافة تحديث
          </Button>
        </div>

        {timelines.length === 0 ? (
          <div className="text-center py-4 text-sm text-slate-500">
            لا توجد تحديثات زمنية مسجلة لهذه المرحلة.
          </div>
        ) : (
          <div className="space-y-2">
            {timelines.map((tl) => {
              const stMap = statusMap[tl.status as string] || { label: tl.status, color: 'text-slate-500' };
              return (
                <div key={tl.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div>
                    <div className="font-medium text-sm text-slate-900">{tl.stage_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatArabicDate(new Date(tl.start_date))} - {formatArabicDate(new Date(tl.expected_end_date))}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-xs font-semibold text-slate-700">
                      إنجاز: {tl.stage_progress}%
                    </div>
                    <div className={`text-xs font-semibold ${stMap.color.replace('bg-', 'text-').replace('100', '600')}`}>
                      {stMap.label}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon-xs" onClick={() => onEditTimeline(tl, stage)}>
                        تعديل
                      </Button>
                      <Button variant="ghost" size="icon-xs" className="text-destructive hover:text-destructive" onClick={() => onDeleteTimeline(tl, stage)}>
                        حذف
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد مراحل مسجلة"
      loadingLabel="جاري تحميل المراحل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذه المرحلة؟"
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      renderExpandedRow={renderExpandedRow}
      actions={{
        onEdit: (row) => onEdit(row),
        onDelete: (row) => onDelete(row),
      }}
    />
  );
}
