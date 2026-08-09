import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { ProjectTeamMember } from '../project-team.types';

type ProjectTeamTableProps = {
  data: ProjectTeamMember[];
  loading?: boolean;
  onEdit?: (member: ProjectTeamMember) => void;
  onDelete?: (member: ProjectTeamMember) => void;
};

export function ProjectTeamTable({ data, loading, onEdit, onDelete }: ProjectTeamTableProps) {
  const columns: DataTableColumn<ProjectTeamMember>[] = [
    {
      header: 'اسم الدور / المنصب',
      className: 'min-w-44',
      cell: (m) => (
        <span className="block max-w-56 truncate font-medium text-slate-800" title={m.name}>{m.name}</span>
      ),
    },
    {
      header: 'عضو الفريق',
      className: 'min-w-48',
      cell: (m) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {m.user?.name?.charAt(0) ?? '؟'}
          </div>
          <span className="block max-w-48 truncate text-sm text-slate-700" title={m.user?.name}>{m.user?.name ?? '—'}</span>
        </div>
      ),
    },
    {
      header: 'البريد الإلكتروني',
      className: 'min-w-56',
      cell: (m) =>
        m.user?.email ? (
          <a
            href={`mailto:${m.user.email}`}
            dir="ltr"
            className="block max-w-64 truncate text-start text-sm text-primary hover:text-primary/80 hover:underline"
            title={m.user.email}
          >
            {m.user.email}
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      header: 'تاريخ الإضافة',
      className: 'min-w-32',
      cell: (m) =>
        m.created_at
          ? new Date(m.created_at).toLocaleDateString('ar-SA')
          : '—',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا يوجد أعضاء في فريق هذا المشروع"
      loadingLabel={
        <div className="flex flex-col gap-2 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      }
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذا العضو من فريق المشروع؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      actions={{ onEdit, onDelete }}
    />
  );
}
