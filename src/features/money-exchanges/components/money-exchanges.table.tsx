import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import {
  FundLink,
  UserLink,
  getFundTypeLabel,
} from '@/features/components/table-helpers';
import { formatArabicDate } from '@/shared/lib/utils';
import type { MoneyExchange } from '../types';

type MoneyExchangesTableProps = {
  data: MoneyExchange[];
  loading?: boolean;
  onEdit?: (exchange: MoneyExchange) => void;
  onDelete?: (exchange: MoneyExchange) => void;
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
};

export function MoneyExchangesTable({
  data,
  loading,
  onEdit,
  onDelete,
  sort,
  onSortChange,
}: MoneyExchangesTableProps) {
  const columns: DataTableColumn<MoneyExchange>[] = [
    {
      header: 'نوع الصندوق',
      cell: (row) => getFundTypeLabel(row.exchangeable_type),
    },
    {
      header: 'الصندوق',
      cell: (row) => (
        <FundLink
          type={row.exchangeable_type}
          info={row.exchangeable_info}
          fallbackUser={row.exchangeable_info?.user_info?.user}
        />
      ),
    },
    {
      header: 'من العملة',
      cell: (row) => `${row.from_currency.currency} (${row.from_currency.symbol})`,
    },
    {
      header: 'إلى العملة',
      cell: (row) => `${row.to_currency.currency} (${row.to_currency.symbol})`,
    },
    {
      header: 'المبلغ',
      sortable: true,
      sortKey: 'amount',
      cell: (row) => {
        const amount = Number(row.amount || 0).toLocaleString();
        return (
          <div className="flex items-center gap-1 font-mono font-medium">
            <span>{amount}</span>
            <span className="text-xs text-muted-foreground">{row.from_currency.symbol}</span>
          </div>
        );
      },
    },
    {
      header: 'سعر التصريف',
      sortable: true,
      sortKey: 'exchange_rate',
      cell: (row) => {
        const rate = Number(row.exchange_rate || 0).toLocaleString();
        return (
          <div className="flex items-center gap-1 font-mono font-medium text-slate-600">
            <span>{rate}</span>
          </div>
        );
      },
    },
    {
      header: 'العملية',
      sortable: true,
      sortKey: 'operation',
      cell: (row) => (
        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 border border-slate-200">
          {row.operation === 'multiply' ? 'ضرب (*)' : 'قسمة (/)'}
        </span>
      ),
    },
    {
      header: 'المبلغ الناتج',
      sortable: true,
      sortKey: 'converted_amount',
      cell: (row) => {
        const converted = Number(row.converted_amount || 0).toLocaleString();
        return (
          <div className="flex items-center gap-1 font-mono font-bold text-emerald-600">
            <span>{converted}</span>
            <span className="text-xs">{row.to_currency.symbol}</span>
          </div>
        );
      },
    },
    {
      header: 'أنشئ بواسطة',
      sortable: true,
      sortKey: 'creator_name',
      cell: (row) => (row.created_by ? <UserLink user={row.created_by} /> : '-'),
    },
    {
      header: 'تاريخ الإنشاء',
      sortable: true,
      sortKey: 'created_at',
      cell: (row) => (row.created_at ? formatArabicDate(row.created_at) : '-'),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد عمليات تصريف عملة"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف عملية التصريف هذه؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      sort={sort}
      onSortChange={onSortChange}
      actions={{
        onEdit,
        onDelete,
      }}
    />
  );
}
