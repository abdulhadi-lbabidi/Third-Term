import { ArrowLeftRight } from 'lucide-react';
import { FinancialEmptyState } from './financial-empty-state';

type Transfer = {
  id: number;
  name: string;
  amount: string | number;
  morph_from_info?: any;
  morph_to_info?: any;
  created_at?: string;
};

type TransfersListProps = {
  data: Transfer[];
};

function getTransferDetails(info?: any) {
  if (!info) {
    return {
      label: '-',
      type: '-',
      currency: '',
    };
  }

  const details = info.details;
  let type = '-';
  if (info.type === 'company_fund') {
    type = 'صندوق شركة';
  } else if (info.type === 'project_fund') {
    type = 'صندوق مشروع';
  } else if (info.type === 'user_fund' || info.type === 'currency_fund') {
    type = 'صندوق مستخدم';
  }

  let label = '-';
  if (details) {
    if (details.project_fund) {
      label = details.project_fund.name ?? '-';
    } else if (details.company_fund) {
      label = details.company_fund.name ?? '-';
    } else if (details.fund) {
      label = details.fund.name ?? details.fund.user?.name ?? '-';
    } else if (details.name) {
      label = details.name;
    } else if (details.user?.name) {
      label = details.user.name;
    } else {
      label = `صندوق #${details.company_fund_id ?? details.project_fund_id ?? details.fund_id ?? details.id ?? '-'}`;
    }
  }

  let currency = '';
  if (details?.currency) {
    currency = details.currency.symbol || details.currency.currency || '';
  }

  return { label, type, currency };
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
      {data.map((transfer) => {
        const fromDetails = getTransferDetails(transfer.morph_from_info);
        const toDetails = getTransferDetails(transfer.morph_to_info);
        const amountSymbol = fromDetails.currency || toDetails.currency || '';

        return (
          <div key={transfer.id} className="bg-white border border-[#E7E9EF] rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-[#C9A84C]/35 transition-all duration-200">
            <div>
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
                  {formatNumber(transfer.amount)} <span className="text-[10px] font-bold text-slate-500 mx-0.5">{amountSymbol}</span>
                </span>
              </div>
              
              <div className="pt-3 mt-4 space-y-2 text-[10px] text-slate-500 border-t border-slate-100">
                <div className="flex flex-col gap-1 bg-slate-50 rounded-lg p-2.5 border border-slate-100/60">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-semibold text-slate-400 shrink-0">الجهة المرسلة:</span>
                    <span className="font-bold text-slate-700 text-right truncate" title={fromDetails.label}>{fromDetails.label}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-400">
                    <span>{fromDetails.type}</span>
                    {fromDetails.currency && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100/50 font-bold px-1.5 py-0.5 rounded text-[8px]">{fromDetails.currency}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 bg-slate-50 rounded-lg p-2.5 border border-slate-100/60">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-semibold text-slate-400 shrink-0">الجهة المستلمة:</span>
                    <span className="font-bold text-slate-700 text-right truncate" title={toDetails.label}>{toDetails.label}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-400">
                    <span>{toDetails.type}</span>
                    {toDetails.currency && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100/50 font-bold px-1.5 py-0.5 rounded text-[8px]">{toDetails.currency}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 mt-4 text-[9px] text-[#667085]">
              <span>تاريخ التحويل</span>
              <span className="font-semibold">{formatDate(transfer.created_at)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
