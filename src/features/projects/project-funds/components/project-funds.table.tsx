import { Banknote, Eye } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { ProjectFund } from '../project-funds.types';

type ProjectFundsTableProps = {
  data: ProjectFund[];
  loading?: boolean;
  onEdit?: (fund: ProjectFund) => void;
  onDelete?: (fund: ProjectFund) => void;
  onAttachCurrency?: (fund: ProjectFund) => void;
  onCurrencyClick?: (fund: ProjectFund, currencyId: number) => void;
  onMoreCurrenciesClick?: (fund: ProjectFund) => void;
  onView?: (fund: ProjectFund) => void;
};

export function ProjectFundsTable({
  data,
  loading,
  onEdit,
  onDelete,
  onAttachCurrency,
  onCurrencyClick,
  onMoreCurrenciesClick,
  onView,
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
            {currencies.slice(0, 3).map((currency) => (
              <button
                key={currency.id}
                type="button"
                onClick={() => onCurrencyClick?.(fund, currency.id)}
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 transition-opacity hover:opacity-80"
              >
                <span>{currency.currency} {currency.symbol}</span>
                <span className="text-[11px] text-sky-700">({currency.balance})</span>
              </button>
            ))}
            {(currencies.length > 3) ? (
              <button
                type="button"
                onClick={() => onMoreCurrenciesClick?.(fund)}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition-opacity hover:opacity-80"
              >
                عرض المزيد
              </button>
            ) : null}
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
      emptyLabel="لا توجد صناديق لهذا المشروع"
      loadingLabel={
        <div className="flex flex-col gap-2 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      }
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذا الصندوق؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      actions={{
        onEdit,
        onDelete,
        extraActions: [
          ...(onView
            ? [
                {
                  label: 'عرض التفاصيل',
                  icon: <Eye className="size-4" />,
                  onClick: onView,
                },
              ]
            : []),
          ...(onAttachCurrency
            ? [
                {
                  label: 'إرفاق عملة',
                  icon: <Banknote className="size-4" />,
                  onClick: onAttachCurrency,
                },
              ]
            : []),
        ],
      }}
    />
  );
}
