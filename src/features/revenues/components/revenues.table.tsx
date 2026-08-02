import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import {
  getBooleanLabel,
  getCurrencyStringFromInfo,
  UserLink,
  FundLink,
  type TableUser
} from '@/features/components/table-helpers';
import type { Revenue } from '../types';

type RevenueRow = Revenue & {
  user?: TableUser;
  received_by?: TableUser;
};

type RevenuesTableProps = {
  data: Revenue[];
  loading?: boolean;
  onEdit?: (revenue: Revenue) => void;
  onDelete?: (revenue: Revenue) => void;
  hideTypeColumn?: boolean;
};

export function RevenuesTable({ data, loading, onEdit, onDelete, hideTypeColumn }: RevenuesTableProps) {
  const allColumns: DataTableColumn<Revenue>[] = [
    { header: 'البيان', cell: (row) => row.statement },
    {
      header: 'المبلغ',
      cell: (row) => {
        const amount = Number(row.amount || 0).toLocaleString();
        const currency = getCurrencyStringFromInfo(row.revenueable_info);
        return (
          <div className="flex items-center gap-1">
            <span className="finance-num font-medium">{amount}</span>
            {currency ? <span className="text-xs text-muted-foreground">{currency}</span> : null}
          </div>
        );
      }
    },
    { header: 'المستخدم', cell: (row) => <UserLink user={(row as RevenueRow).user} /> },
    { header: 'نوع الإيراد', cell: (row) => <FundLink type={row.revenueable_type} info={row.revenueable_info} fundTab="revenues" fallbackUser={(row as RevenueRow).user} /> },
    {
      header: 'تم الترحيل',
      cell: (row) => (
        <span className={row.is_posted ? 'font-medium bg-emerald-100 border border-emerald-200 rounded p-2 text-emerald-800' : 'font-medium text-rose-600'}>
          {getBooleanLabel(row.is_posted)}
        </span>
      ),
    },
    { header: 'مستلم بواسطة', cell: (row) => <UserLink user={(row as RevenueRow).received_by} /> },
    { header: 'تاريخ الإنشاء', cell: (row) => row.created_at ?? '-' },
  ];

  const columns = hideTypeColumn ? allColumns.filter((col) => col.header !== 'نوع الإيراد') : allColumns;

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
