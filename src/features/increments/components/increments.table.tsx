import dayjs from 'dayjs';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Increment } from '../types';

type IncrementsTableProps = {
  data: Increment[];
  loading?: boolean;
  onEdit?: (increment: Increment) => void;
  onDelete?: (increment: Increment) => void;
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
};

export function IncrementsTable({
  data,
  loading,
  onEdit,
  onDelete,
  sort,
  onSortChange,
}: IncrementsTableProps) {
  const columns: DataTableColumn<Increment>[] = [
    {
      header: 'الموظف',
      cell: (row) => row.employee?.user?.name ?? '-',
      sortable: true,
      sortKey: 'name',
    },
    { header: 'المسمى الوظيفي', cell: (row) => row.employee?.job_title ?? '-' },
    {
      header: 'التاريخ',
      cell: (row) => (row.date ? dayjs(row.date).format('YYYY-MM-DD') : '-'),
      sortable: true,
      sortKey: 'date',
    },
    {
      header: 'المبلغ',
      cell: (row) => String(row.amount),
      sortable: true,
      sortKey: 'amount',
    },
    { header: 'السبب', cell: (row) => row.reason ?? '-' },
    { header: 'تاريخ الإنشاء', cell: (row) => row.created_at ?? '-' },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      emptyLabel="لا توجد زيادات"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذه الزيادة؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      actions={{
        onEdit,
        onDelete,
      }}
    />
  );
}
