import { Banknote } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { CompanyFund } from '../types';

type CompanyFundsTableProps = {
  data: CompanyFund[];
  loading?: boolean;
  onEdit?: (fund: CompanyFund) => void;
  onDelete?: (fund: CompanyFund) => void;
  onAttachCurrency?: (fund: CompanyFund) => void;
};

export function CompanyFundsTable({ data, loading, onEdit, onDelete, onAttachCurrency }: CompanyFundsTableProps) {
  const columns: DataTableColumn<CompanyFund>[] = [
    { header: 'اسم الصندوق', cell: (fund) => fund.name },
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
      emptyLabel="لا توجد صناديق شركة"
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
                label: 'حفظ عملة',
                icon: <Banknote className="size-4" />,
                onClick: onAttachCurrency,
              },
            ]
          : undefined,
      }}
    />
  );
}
