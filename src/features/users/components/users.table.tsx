import { DataTable, type DataTableColumn } from '@/features/components/data-table';

type UsersTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  onDelete?: (row: T) => void;
  onEdit?: (row: T) => void;
};

export function UsersTable<T>({
  columns,
  data,
  loading,
  onDelete,
  onEdit,
}: UsersTableProps<T>) {
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد بيانات"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      actions={{
        onDelete,
        onEdit,
        editLabel: 'عرض تفاصيل المستخدم',
      }}
    />
  );
}
