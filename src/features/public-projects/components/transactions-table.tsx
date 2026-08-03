import { useState } from 'react';
import { TrendingUp, TrendingDown, Receipt, FileText } from 'lucide-react';
import { FinancialEmptyState } from './financial-empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import type { Invoice } from '@/features/invoices/types';

type Transaction = {
  id: number;
  statement?: string;
  description?: string;
  amount: string | number;
  created_at?: string;
  revenueable_info?: any;
  expenseable_info?: any;
};

type TransactionsTableProps = {
  data: Transaction[];
  type: 'revenues' | 'expenses';
  invoices?: Invoice[];
};

export function TransactionsTable({ data, type, invoices = [] }: TransactionsTableProps) {
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {data.map((item) => {
          const info = type === 'revenues' ? item.revenueable_info : item.expenseable_info;
          const currencySymbol = info?.details?.currency?.symbol || info?.details?.currency?.currency || '';
          const fundName = info?.details?.project_fund?.name || '';
          const expenseInvoices = type === 'expenses'
            ? invoices.filter((inv) => inv.expense_id === item.id || inv.expense?.id === item.id)
            : [];

          return (
            <div key={item.id} className="bg-white border border-[#E7E9EF] rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-[#C9A84C]/35 transition-all duration-200">
              <div>
                <div className="flex justify-between items-start gap-2.5">
                  <h4 className="text-xs font-bold text-[#172033] line-clamp-2 leading-normal">
                    {type === 'revenues' ? item.statement : item.description}
                  </h4>
                  <span className={`shrink-0 text-xs sm:text-sm font-extrabold ${type === 'revenues' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {type === 'revenues' ? '+' : '-'}{formatNumber(item.amount)} <span className="text-xs sm:text-sm font-bold text-slate-500 mx-1">{currencySymbol}</span>
                  </span>
                </div>

                {type === 'expenses' && expenseInvoices.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedExpense(item);
                      setIsDialogOpen(true);
                    }}
                    className="w-full mt-3 flex items-center justify-between text-[10px] text-blue-600 bg-blue-50/70 hover:bg-blue-100/70 py-1.5 px-2.5 rounded-lg border border-blue-100/80 transition-all font-semibold"
                  >
                    <span className="flex items-center gap-1">
                      <Receipt className="size-3 text-blue-500" />
                      <span>استعراض الفواتير ({expenseInvoices.length})</span>
                    </span>
                    <span className="text-[9px] text-blue-500 hover:underline">عرض التفاصيل ←</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 mt-4 space-y-1 text-[9px] text-[#667085]">
                {fundName && (
                  <div className="flex items-center justify-between">
                    <span>الصندوق التابع</span>
                    <span className="font-semibold text-slate-700">{fundName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>تاريخ القيد</span>
                  <span className="font-semibold">{formatDate(item.created_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isDialogOpen && selectedExpense && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto font-tajawal" dir="rtl">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Receipt className="size-5 text-blue-600" />
                <span>فواتير المصروف: {selectedExpense.description}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-3">
              {invoices
                .filter((inv) => inv.expense_id === selectedExpense.id || inv.expense?.id === selectedExpense.id)
                .map((invoice) => {
                  const supplierName = typeof invoice.supplier === 'string'
                    ? invoice.supplier
                    : invoice.supplier?.name;
                  const itemName = typeof invoice.item === 'string'
                    ? invoice.item
                    : invoice.item?.name;

                  return (
                    <div key={invoice.id} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex justify-between items-center">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-800">
                            فاتورة #{invoice.invoice_number}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-4">
                          <span>المورد: <span className="font-semibold text-slate-700">{supplierName || '-'}</span></span>
                          <span>البند: <span className="font-semibold text-slate-700">{itemName || '-'}</span></span>
                          <span>التاريخ: <span className="font-semibold">{invoice.date}</span></span>
                        </div>
                      </div>
                      <div className="text-left space-y-1">
                        <span className="block text-xs font-extrabold text-blue-700">
                          {formatNumber(invoice.final_total)}
                        </span>
                        {Number(invoice.discount) > 0 && (
                          <span className="block text-[9px] text-rose-600 font-semibold">
                            خصم: -{formatNumber(invoice.discount)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

