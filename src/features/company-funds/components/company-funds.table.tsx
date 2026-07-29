import { Banknote } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { CompanyFund } from '../types';

type CompanyFundsTableProps = {
  data: CompanyFund[];
  loading?: boolean;
  onEdit?: (fund: CompanyFund) => void;
  onDelete?: (fund: CompanyFund) => void;
  onAttachCurrency?: (fund: CompanyFund) => void;
  onCurrencyClick?: (fund: CompanyFund, currencyId: number) => void;
  onMoreCurrenciesClick?: (fund: CompanyFund) => void;
};

export function CompanyFundsTable({
  data,
  loading,
  onEdit,
  onDelete,
  onAttachCurrency,
  onMoreCurrenciesClick,
}: CompanyFundsTableProps) {
  const columns: DataTableColumn<CompanyFund>[] = [
    { header: 'اسم الصندوق', cell: (fund) => fund.name },
    {
      header: 'العملة',
      cell: (fund) => {
        const currencies = fund.currencies ?? [];

        if (!currencies.length) return <span className="text-slate-500">-</span>;

        return (
          <div className="flex flex-wrap gap-2">
            {currencies.slice(0, 3).map((currency) => (
              <button
                key={currency.id}
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 transition-opacity hover:opacity-80"
              >
                <span>{currency.currency} {currency.symbol}</span>
                <span className="text-[11px] text-sky-700">({currency.balance})</span>
              </button>
            ))}
            {currencies.length > 3 ? (
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
