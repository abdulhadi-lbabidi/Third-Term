import { Eye } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Currency } from '../types';

type CurrencyTableProps = {
  data: Currency[];
  loading: boolean;
  onEdit: (currency: Currency) => void;
  onDelete: (currency: Currency) => void | Promise<void>;
  onView?: (currency: Currency) => void;
};

export function CurrencyTable({ data, loading, onEdit, onDelete, onView }: CurrencyTableProps) {
  const columns: DataTableColumn<Currency>[] = [
    { header: 'اسم العملة', cell: (row) => row.currency },
    { header: 'الرمز', cell: (row) => row.symbol },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد عملات"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذه العملة؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      actions={{
        onExtra: onView,
        onEdit,
        onDelete,
        extraLabel: 'عرض التفاصيل',
        extraIcon: <Eye className="size-4" />,
      }}
    />
  );
}
