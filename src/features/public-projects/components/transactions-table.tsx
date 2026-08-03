import { TrendingUp, TrendingDown } from 'lucide-react';
import { FinancialEmptyState } from './financial-empty-state';

type Transaction = {
  id: number;
  statement?: string;
  description?: string;
  amount: string | number;
  created_at?: string;
};

type TransactionsTableProps = {
  data: Transaction[];
  type: 'revenues' | 'expenses';
};

export function TransactionsTable({ data, type }: TransactionsTableProps) {
  const formatNumber = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-SA');
  };

  if (data.length === 0) {
    return type === 'revenues' ? (
      <FinancialEmptyState
        icon={TrendingUp}
        title="لا توجد إيرادات مسجلة"
        description="لم يتم تسجيل أي عمليات إيداع أو إيرادات مالية خاصة بهذا المشروع حتى الآن."
      />
    ) : (
      <FinancialEmptyState
        icon={TrendingDown}
        title="لا توجد مصروفات مسجلة"
        description="لم يتم تسجيل أي عمليات صرف أو تكاليف تشغيلية خاصة بهذا المشروع حتى الآن."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {data.map((item) => (
        <div key={item.id} className="bg-white border border-[#E7E9EF] rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-[#C9A84C]/35 transition-all duration-200">
          <div className="flex justify-between items-start gap-2.5">
            <h4 className="text-xs font-bold text-[#172033] line-clamp-2 leading-normal">
              {type === 'revenues' ? item.statement : item.description}
            </h4>
            <span className={`shrink-0 text-xs sm:text-sm font-extrabold ${type === 'revenues' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {type === 'revenues' ? '+' : '-'}{formatNumber(item.amount)}
            </span>
          </div>
          <div className="pt-2.5 border-t border-slate-100 mt-4 flex items-center justify-between text-[9px] text-[#667085]">
            <span>تاريخ القيد</span>
            <span className="font-semibold">{formatDate(item.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
