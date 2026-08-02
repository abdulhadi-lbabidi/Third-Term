import { ArrowLeftRight } from 'lucide-react';
import { FinancialEmptyState } from './financial-empty-state';

type TransferInfo = {
  type?: string;
  details?: {
    company_fund?: { name: string };
    project_fund?: { name: string };
    fund?: { name: string; user?: { name: string } };
  };
};

type Transfer = {
  id: number;
  name: string;
  amount: string | number;
  morph_from_info?: TransferInfo;
  morph_to_info?: TransferInfo;
  created_at?: string;
};

type TransfersListProps = {
  data: Transfer[];
};

function getFundName(info?: TransferInfo) {
  if (!info) return '-';
  const details = info.details;
  if (!details) return '-';
  if (info.type === 'company_fund' && details.company_fund) {
    return `الشركة: ${details.company_fund.name}`;
  }
  if (info.type === 'project_fund' && details.project_fund) {
    return `المشروع: ${details.project_fund.name}`;
  }
  if (details.fund) {
    return `مستخدم: ${details.fund.name ?? details.fund.user?.name ?? '-'}`;
  }
  return '-';
}

export function TransfersList({ data }: TransfersListProps) {
  const formatNumber = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ar-SA');
  };

  if (data.length === 0) {
    return (
      <FinancialEmptyState
        icon={ArrowLeftRight}
        title="لا توجد تحويلات مالية مسجلة"
        description="لم يتم تسجيل أي عمليات تحويل مالي لهذا الصندوق بعد."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {data.map((transfer) => (
        <div key={transfer.id} className="bg-white border border-[#E7E9EF] rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-[#C9A84C]/35 transition-all duration-200">
          <div className="flex justify-between items-start gap-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <ArrowLeftRight className="size-4 text-current" />
              </div>
              <h4 className="text-xs font-bold text-[#172033] line-clamp-1">
                {transfer.name}
              </h4>
            </div>
            <span className="shrink-0 text-xs sm:text-sm font-extrabold text-[#C9A84C]">
              {formatNumber(transfer.amount)}
            </span>
          </div>
          
          <div className="pt-2.5 border-t border-slate-100 mt-4 space-y-1.5 text-[9px] text-[#667085]">
            <div className="flex justify-between">
              <span>من: {getFundName(transfer.morph_from_info)}</span>
              <span>إلى: {getFundName(transfer.morph_to_info)}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span>تاريخ التحويل</span>
              <span className="font-semibold">{formatDate(transfer.created_at)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
