import { FileText } from 'lucide-react';
import { FinancialEmptyState } from './financial-empty-state';

type Invoice = {
  id: number;
  invoice_number: string;
  date: string;
  final_total: string | number;
  discount: string | number;
};

type InvoicesListProps = {
  data: Invoice[];
};

export function InvoicesList({ data }: InvoicesListProps) {
  const formatNumber = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  if (data.length === 0) {
    return (
      <FinancialEmptyState
        icon={FileText}
        title="لا توجد فواتير مسجلة"
        description="لم يتم إصدار أو تسجيل أي فواتير مالية خاصة بهذا المشروع حتى الآن."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {data.map((invoice) => (
        <div key={invoice.id} className="bg-white border border-[#E7E9EF] rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-[#C9A84C]/35 transition-all duration-200">
          <div className="flex justify-between items-start gap-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="size-4 text-current" />
              </div>
              <h4 className="text-xs font-bold text-[#172033]">
                فاتورة #{invoice.invoice_number}
              </h4>
            </div>
            <span className="shrink-0 text-xs sm:text-sm font-extrabold text-blue-700">
              {formatNumber(invoice.final_total)}
            </span>
          </div>
          
          <div className="pt-2.5 border-t border-slate-100 mt-4 flex items-center justify-between text-[9px] text-[#667085]">
            <div>
              <span>الخصم: </span>
              <span className="text-rose-600 font-semibold">{formatNumber(invoice.discount) !== '٠' ? `-${formatNumber(invoice.discount)}` : '0'}</span>
            </div>
            <span className="font-semibold">{invoice.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
