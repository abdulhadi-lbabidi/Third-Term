import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import {
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
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
};

export function RevenuesTable({
  data,
  loading,
  onEdit,
  onDelete,
  hideTypeColumn,
  sort,
  onSortChange,
}: RevenuesTableProps) {
  const allColumns: DataTableColumn<Revenue>[] = [
    { header: 'رقم السند', cell: (row) => row.voucher_number || '-' },
    { header: 'البيان', cell: (row) => row.statement },
    {
      header: 'المبلغ',
      sortable: true,
      sortKey: 'amount',
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
    { header: 'نوع الإيراد', cell: (row) => <FundLink type={row.revenueable_type} info={row.revenueable_info} fundTab="revenues" fallbackUser={(row as RevenueRow).user} /> },
    { header: 'المستلم بيد', cell: (row) => row.note ?? '-' },
    { header: 'مستلم بواسطة', sortable: true, sortKey: 'receiver_name', cell: (row) => <UserLink user={(row as RevenueRow).received_by} /> },
    { header: 'تاريخ الإنشاء', sortable: true, sortKey: 'created_at', cell: (row) => row.created_at ?? '-' },
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
      sort={sort}
      onSortChange={onSortChange}
      actions={{
        onEdit,
        onDelete,
        extraActions: undefined,
      }}
    />
  );
}
