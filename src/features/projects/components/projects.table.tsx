import { Eye, WalletMinimal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import type { Project } from '../types';
import dayjs from 'dayjs';

type ProjectsTableProps = {
  data: Project[];
  loading?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onAddFund?: (project: Project) => void;
  onView?: (project: Project) => void;
};

export function ProjectsTable({ data, loading, onEdit, onDelete, onAddFund, onView }: ProjectsTableProps) {
  const statusLabels: Record<Project['status'], string> = {
    pending: 'قيد الانتظار',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتمل',
    cancelled: 'ملغي',
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
    cancelled: {
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    },
  };

  const columns: DataTableColumn<Project>[] = [
    {
      header: 'اسم المشروع',
      cell: (row) => (
        <Link to={`/projects/${row.id}`} className="font-medium text-primary hover:underline hover:text-primary/80 transition-colors">
          {row.name}
        </Link>
      )
    },
    { header: 'العميل', cell: (row) => row.client?.user?.name ?? '-' },
    { header: 'القسم', cell: (row) => row.department?.name ?? '-' },
    {
      header: 'التكلفة المتوقعة',
      cell: (row) => Number(row.expected_cost || 0).toLocaleString('en-US'),
    },
    {
      header: 'الحالة',
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
    { header: 'تاريخ الإنشاء', cell: (row) => (row.created_at ? dayjs(row.created_at).format('YYYY-MM-DD') : '-') },
  ];

  return (
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
  );
}
