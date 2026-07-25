import { Eye } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Department } from '../types';

type DepartmentTableProps = {
  data: Department[];
  loading: boolean;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void | Promise<void>;
  onView?: (department: Department) => void;
};

export function DepartmentTable({ data, loading, onEdit, onDelete, onView }: DepartmentTableProps) {
  const columns: DataTableColumn<Department>[] = [
    { header: 'الاسم', cell: (row) => row.name },
    { header: 'المدير', cell: (row) => row.main_manager || '-' },
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
