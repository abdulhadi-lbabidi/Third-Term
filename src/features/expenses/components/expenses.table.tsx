import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Expense } from '../types';

type ExpensesTableProps = {
  data: Expense[];
  loading?: boolean;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
};

export function ExpensesTable({ data, loading, onEdit, onDelete }: ExpensesTableProps) {
  const columns: DataTableColumn<Expense>[] = [
    { header: 'الوصف', cell: (row) => row.description },
    { header: 'المبلغ', cell: (row) => row.amount },
    { header: 'نوع الصرف', cell: (row) => row.expenseable_type ?? '-' },
    { header: 'المعرف', cell: (row) => String(row.expenseable_id ?? '-') },
    { header: 'تاريخ الإنشاء', cell: (row) => row.created_at ?? '-' },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد مصروفات"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      actions={{
        onEdit,
        onDelete,
        extraActions: undefined,
      }}
    />
  );
}
