import { Eye } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Currency } from '../types';

type CurrencyTableProps = {
  data: Currency[];
  loading: boolean;
  onEdit: (currency: Currency) => void;
  onDelete: (currency: Currency) => void | Promise<void>;
  onView?: (currency: Currency) => void;
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
};

export function CurrencyTable({ data, loading, onEdit, onDelete, onView, sort, onSortChange }: CurrencyTableProps) {
  const columns: DataTableColumn<Currency>[] = [
    { header: 'اسم العملة', cell: (row) => row.currency, sortable: true, sortKey: 'currency' },
    { header: 'الرمز', cell: (row) => row.symbol, sortable: true, sortKey: 'symbol' },
    { header: 'تاريخ الإضافة', cell: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString('ar-SA') : '—', sortable: true, sortKey: 'created_at' },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      emptyLabel="لا توجد عملات"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذه العملة؟ لا يمكن التراجع عن هذا الإجراء."
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
