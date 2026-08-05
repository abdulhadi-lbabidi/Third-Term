import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import { Wallet } from 'lucide-react';

type UsersTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  onFunds?: (row: T) => void;
  onEmployeePayments?: (row: T) => void;
};

export function UsersTable<T>({
  columns,
  data,
  loading,
  onDelete,
  onView,
  onFunds,
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
        onView,
        viewLabel: 'تفاصيل المستخدم',
        extraActions: onFunds ? [
          {
            label: 'صناديقي',
            icon: <Wallet className="size-4" />,
            onClick: onFunds,
          }
        ] : undefined,
      }}
    />
  );
}
