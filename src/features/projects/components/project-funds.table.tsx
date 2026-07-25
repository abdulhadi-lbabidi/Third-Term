import { Banknote } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { ProjectFund } from '../project-funds.types';

type ProjectFundsTableProps = {
  data: ProjectFund[];
  loading?: boolean;
  onEdit?: (fund: ProjectFund) => void;
  onDelete?: (fund: ProjectFund) => void;
  onAttachCurrency?: (fund: ProjectFund) => void;
};

export function ProjectFundsTable({
  data,
  loading,
  onEdit,
  onDelete,
  onAttachCurrency,
}: ProjectFundsTableProps) {
  const columns: DataTableColumn<ProjectFund>[] = [
    { header: 'اسم الصندوق', cell: (fund) => fund.name },
    { header: 'المشروع', cell: (fund) => fund.project?.name ?? '-' },
    {
      header: 'العملات',
      cell: (fund) => {
        const currencies = fund.currencies ?? [];

        if (!currencies.length) return <span className="text-slate-500">-</span>;

        return (
          <div className="flex flex-wrap gap-2">
            {currencies.map((currency) => (
              <span
                key={currency.id}
                className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800"
              >
                {currency.currency} {currency.symbol}
              </span>
            ))}
          </div>
        );
      },
    },
    { header: 'تاريخ الإنشاء', cell: (fund) => fund.created_at ?? '-' },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد صناديق مشاريع"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذا الصندوق؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      actions={{
        onEdit,
        onDelete,
        extraActions: onAttachCurrency
          ? [
              {
                label: 'إرفاق عملة',
                icon: <Banknote className="size-4" />,
                onClick: onAttachCurrency,
              },
            ]
          : undefined,
      }}
    />
  );
}
