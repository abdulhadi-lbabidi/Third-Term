import { Eye } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Department } from '../types';
import { formatArabicDate } from '@/shared/lib/utils';

type DepartmentTableProps = {
  data: Department[];
  loading: boolean;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void | Promise<void>;
  onView?: (department: Department) => void;
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
};

export function DepartmentTable({
  data,
  loading,
  onEdit,
  onDelete,
  onView,
  sort,
  onSortChange,
}: DepartmentTableProps) {
  const columns: DataTableColumn<Department>[] = [
    { header: 'الاسم', sortable: true, sortKey: 'Name', cell: (row) => row.name },
    { header: 'المدير', sortable: true, sortKey: 'Main_Manager', cell: (row) => row.main_manager || '-' },
    { header: 'تاريخ الإنشاء', sortable: true, sortKey: 'created_at', cell: (row) => row.created_at ? formatArabicDate(row.created_at) : '-' },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد أقسام"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذا القسم؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      sort={sort}
      onSortChange={onSortChange}
      onRowClick={onView}
      actions={{
        extraActions: onView
          ? [
              {
                label: 'عرض التفاصيل',
                icon: <Eye className="size-4" />,
                onClick: onView,
              },
            ]
          : undefined,
        onEdit,
        onDelete,
      }}
    />
  );
}
