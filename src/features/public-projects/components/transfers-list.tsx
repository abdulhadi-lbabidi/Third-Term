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
  onViewDetails: (id: number) => void;
};

export function getTransferDetails(info?: any) {
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

export function TransfersList({ data, onViewDetails }: TransfersListProps) {
  const formatNumber = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US');
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {data.map((transfer) => {
          const fromDetails = getTransferDetails(transfer.morph_from_info);
          const toDetails = getTransferDetails(transfer.morph_to_info);
          const amountSymbol = fromDetails.currency || toDetails.currency || '';

          return (
            <div
              key={transfer.id}
              onClick={() => onViewDetails(transfer.id)}
              className="bg-card border border-border rounded-lg p-4 shadow-finance hover:border-accent-gold/40 cursor-pointer transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-xs text-foreground truncate" title={fromDetails.label}>
                      {fromDetails.label}
                    </span>
                    <ArrowLeftRight className="size-3 text-warning shrink-0 mx-1" />
                    <span className="text-xs font-semibold text-foreground truncate" title={toDetails.label}>
                      {toDetails.label}
                    </span>
                  </div>

                  <span className="shrink-0 text-xs sm:text-sm font-bold font-mono text-accent-gold">
                    {formatNumber(transfer.amount)} <span className="text-[10px] font-semibold text-muted-foreground mx-0.5">{amountSymbol}</span>
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2.5 border-t border-border mt-3 text-[9px] text-muted-foreground">
                <span className="truncate max-w-[150px] font-medium text-foreground">{transfer.name}</span>
                <span>{formatDate(transfer.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
