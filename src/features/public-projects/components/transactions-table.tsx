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
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US');
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((item) => {
          const info = type === 'revenues' ? item.revenueable_info : item.expenseable_info;
          const currencySymbol = info?.details?.currency?.symbol || info?.details?.currency?.currency || '';
          const fundName = info?.details?.project_fund?.name || '';
          const expenseInvoices = type === 'expenses'
            ? invoices.filter((inv) => inv.expense_id === item.id || inv.expense?.id === item.id)
            : [];

          return (
            <div key={item.id} className="bg-card border border-border rounded-lg p-4 shadow-finance flex flex-col justify-between hover:border-accent-gold/30 transition-all duration-200">
              <div>
                <div className="flex justify-between items-start gap-2.5">
                  <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-normal">
                    {type === 'revenues' ? item.statement : item.description}
                  </h4>
                  <span className={`shrink-0 text-xs font-bold font-mono ${type === 'revenues' ? 'text-success' : 'text-destructive'}`}>
                    {type === 'revenues' ? '+' : '-'}{formatNumber(item.amount)} <span className="text-[10px] font-semibold text-muted-foreground mx-1">{currencySymbol}</span>
                  </span>
                </div>

                {type === 'expenses' && expenseInvoices.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedExpense(item);
                      setIsDialogOpen(true);
                    }}
                    className="w-full mt-3 flex items-center justify-between text-[10px] text-primary bg-primary/10 hover:bg-primary/15 py-1.5 px-2.5 rounded-md border border-primary/20 transition-all font-semibold"
                  >
                    <span className="flex items-center gap-1">
                      <Receipt className="size-3 text-primary" />
                      <span>استعراض الفواتير ({expenseInvoices.length})</span>
                    </span>
                    <span className="text-[9px] text-primary hover:underline">عرض التفاصيل ←</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-border mt-4 space-y-1 text-[9px] text-muted-foreground">
                {fundName && (
                  <div className="flex items-center justify-between">
                    <span>الصندوق التابع</span>
                    <span className="font-semibold text-foreground">{fundName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>تاريخ القيد</span>
                  <span className="font-semibold text-foreground">{formatDate(item.created_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isDialogOpen && selectedExpense && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto font-sans" dir="rtl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Receipt className="size-5 text-primary" />
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
                    <div key={invoice.id} className="bg-muted border border-border rounded-lg p-4 flex justify-between items-center">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-primary" />
                          <span className="text-xs font-semibold text-foreground">
                            فاتورة #{invoice.invoice_number}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-4">
                          <span>المورد: <span className="font-semibold text-foreground">{supplierName || '-'}</span></span>
                          <span>البند: <span className="font-semibold text-foreground">{itemName || '-'}</span></span>
                          <span>التاريخ: <span className="font-semibold">{invoice.date}</span></span>
                        </div>
                      </div>
                      <div className="text-left space-y-1">
                        <span className="block text-xs font-bold text-primary font-mono">
                          {formatNumber(invoice.final_total)}
                        </span>
                        {Number(invoice.discount) > 0 && (
                          <span className="block text-[9px] text-destructive font-semibold">
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
