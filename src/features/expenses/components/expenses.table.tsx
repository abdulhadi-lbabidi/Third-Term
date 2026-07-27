import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Expense } from '../types';

function getExpenseableTypeLabel(type?: Expense['expenseable_type']) {
  switch (type) {
    case 'App\\Models\\CompanyFundCurrency':
      return 'صندوق الشركة';
    case 'App\\Models\\ProjectFundCurrency':
      return 'صندوق المشروع';
    case 'App\\Models\\CurrencyFund':
      return 'صندوق مستخدم';
    default:
      return '-';
  }
}

function getBooleanLabel(value?: boolean) {
  return value ? 'نعم' : 'لا';
}

function getTextLabel(value: unknown) {
  if (typeof value === 'string' && value.trim().length) {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (value && typeof value === 'object' && 'name' in value) {
    const name = (value as { name?: unknown }).name;
    if (typeof name === 'string' && name.trim().length) {
      return name;
    }
  }

  return '-';
}

type ExpenseRow = Expense & {
  user?: string | { name?: string } | number;
  created_by?: string | { name?: string } | number;
};

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
    { header: 'المستخدم', cell: (row) => getTextLabel((row as ExpenseRow).user) },
    { header: 'نوع الصرف', cell: (row) => getExpenseableTypeLabel(row.expenseable_type) },
    {
      header: 'تم الترحيل',
      cell: (row) => (
        <span className={row.is_posted ? 'font-medium bg-emerald-100 border border-emerald-200 rounded p-2 text-emerald-800' : 'font-medium text-rose-600'}>
          {getBooleanLabel(row.is_posted)}
        </span>
      ),
    },
    { header: 'أنشئ بواسطة', cell: (row) => getTextLabel((row as ExpenseRow).created_by) },
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
