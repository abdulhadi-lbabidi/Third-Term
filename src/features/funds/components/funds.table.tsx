import { Banknote } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Fund } from '../types';

type FundsTableProps = {
  data: Fund[];
  loading?: boolean;
  onEdit?: (fund: Fund) => void;
  onDelete?: (fund: Fund) => void;
  onAttachCurrency?: (fund: Fund) => void;
};

export function FundsTable({ data, loading, onEdit, onDelete, onAttachCurrency }: FundsTableProps) {
  const columns: DataTableColumn<Fund>[] = [
    { header: 'اسم الصندوق', cell: (fund) => fund.name },
    { header: 'المستخدم', cell: (fund) => fund.user?.name ?? '-' },
    {
      header: 'الرصيد',
      cell: (fund) => {
        const currency = fund.currencies?.[0];
        return currency?.balance ?? '-';
      },
    },
    {
      header: 'العملة',
      cell: (fund) => {
        const currency = fund.currencies?.[0];
        return currency ? `${currency.currency} ${currency.symbol}` : '-';
      },
    },
    { header: 'تاريخ الإنشاء', cell: (fund) => fund.created_at ?? '-' },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد صناديق"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      actions={{
        onEdit,
        onDelete,
        extraActions: onAttachCurrency
          ? [
              {
                label: 'إضافة عملة',
                icon: <Banknote className="size-4" />,
                onClick: onAttachCurrency,
              },
            ]
          : undefined,
      }}
    />
  );
}
