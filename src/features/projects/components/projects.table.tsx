import { useState } from 'react';
import { Eye, WalletMinimal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import type { Project } from '../types';
import dayjs from 'dayjs';

type ProjectsTableProps = {
  data: Project[];
  loading?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onAddFund?: (project: Project) => void;
  onView?: (project: Project) => void;
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
};

export function ProjectsTable({ data, loading, onEdit, onDelete, onAddFund, onView, sort, onSortChange }: ProjectsTableProps) {
  const [activeDepartments, setActiveDepartments] = useState<any[] | null>(null);
  const statusLabels: Record<Project['status'], string> = {
    pending: 'مقترح',
    in_progress: 'قيد التنفيذ',
    completed: 'منتهي',
    canceled: 'متوقف',
  };

  const statusStyles: Record<
    Project['status'],
    { text: string; bg: string; border: string }
  > = {
    pending: {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    in_progress: {
      text: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    completed: {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    canceled: {
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    },
  };

  const columns: DataTableColumn<Project>[] = [
    {
      header: 'اسم المشروع',
      sortable: true,
      sortKey: 'name',
      cell: (row) => (
        <Link to={`/projects/${row.id}`} className="font-medium text-primary hover:underline hover:text-primary/80 transition-colors">
          {row.name}
        </Link>
      )
    },
    { header: 'العميل', cell: (row) => row.client?.user?.name ?? '-' },
    {
      header: 'الأقسام',
      cell: (row) => {
        const departments = row.departments?.length
          ? row.departments
          : row.department
            ? [row.department]
            : [];

        return departments.length ? (
          <Badge
            variant="secondary"
            className="cursor-pointer transition-colors hover:bg-slate-100 hover:text-slate-900 font-semibold"
            onClick={() => setActiveDepartments(departments)}
          >
            {departments.length}
          </Badge>
        ) : <span className="text-muted-foreground">-</span>;
      },
    },
    {
      header: 'التكلفة المتوقعة',
      cell: (row) => Number(row.expected_cost || 0).toLocaleString('en-US'),
    },
    {
      header: 'الحالة',
      sortable: true,
      sortKey: 'status',
      cell: (row) => {
        const style = statusStyles[row.status];

        return (
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${style.text} ${style.bg} ${style.border}`}
          >
            {statusLabels[row.status]}
          </span>
        );
      },
    },
    {
      header: 'الصناديق',
      cell: (row) => (
        <Badge
          variant="secondary"
          className="finance-num cursor-pointer transition-colors hover:bg-slate-100 hover:text-slate-900"
          onClick={() => onAddFund?.(row)}
        >
          {row.funds?.length ?? 0}
        </Badge>
      ),
    },
    { header: 'تاريخ الإنشاء', sortable: true, sortKey: 'created_at', cell: (row) => (row.created_at ? dayjs(row.created_at).format('YYYY-MM-DD') : '-') },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        emptyLabel="لا توجد مشاريع"
        loadingLabel={
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        }
        confirmTitle="تأكيد الحذف"
        confirmDescription="هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء."
        cancelLabel="إلغاء"
        deleteLabel="حذف"
        sort={sort}
        onSortChange={onSortChange}
        actions={{
          onEdit,
          onDelete,
          extraActions: onAddFund
            ? [{
              label: 'عرض المشروع',
              icon: <Eye className="size-4" />,
              onClick: (project) => onView?.(project)
            },
            {
              label: 'الصناديق',
              icon: <WalletMinimal className="size-4" />,
              onClick: onAddFund,
            },
            ]
            : undefined,
        }}
      />

      <Dialog open={!!activeDepartments} onOpenChange={(open) => !open && setActiveDepartments(null)}>
        <DialogContent className="max-w-md bg-white border border-border text-foreground">
          <DialogHeader>
            <DialogTitle>أقسام المشروع</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
            {activeDepartments?.map((dep) => (
              <div key={dep.id} className="flex flex-col gap-1 rounded-lg border border-slate-200/80 p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <span className="font-semibold text-slate-800 text-sm">{dep.name}</span>
                {dep.main_manager && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="font-medium text-slate-600">المدير:</span> {dep.main_manager}
                  </span>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
