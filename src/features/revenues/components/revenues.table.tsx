import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Revenue } from '../types';

function getRevenueableTypeLabel(type?: Revenue['revenueable_type']) {
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

type RevenueRow = Revenue & {
  user?: string | { name?: string } | number;
  receiver?: string | { name?: string } | number;
};

type RevenuesTableProps = {
  data: Revenue[];
  loading?: boolean;
  onEdit?: (revenue: Revenue) => void;
  onDelete?: (revenue: Revenue) => void;
};

export function RevenuesTable({ data, loading, onEdit, onDelete }: RevenuesTableProps) {
  const columns: DataTableColumn<Revenue>[] = [
    { header: 'البيان', cell: (row) => row.statement },
    { header: 'المبلغ', cell: (row) => Number(row.amount || 0).toLocaleString() },
    { header: 'المستخدم', cell: (row) => getTextLabel((row as RevenueRow).user) },
    { header: 'نوع الإيراد', cell: (row) => getRevenueableTypeLabel(row.revenueable_type) },
    {
      header: 'تم الترحيل',
      cell: (row) => (
        <span className={row.is_posted ? 'font-medium bg-emerald-100 border border-emerald-200 rounded p-2 text-emerald-800' : 'font-medium text-rose-600'}>
          {getBooleanLabel(row.is_posted)}
        </span>
      ),
    },
    { header: 'مستلم بواسطة', cell: (row) => getTextLabel((row as RevenueRow).receiver) },
    { header: 'المعرف', cell: (row) => String(row.revenueable_id ?? '-') },
    { header: 'تاريخ الإنشاء', cell: (row) => row.created_at ?? '-' },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد إيرادات"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذا الإيراد؟ لا يمكن التراجع عن هذا الإجراء."
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
