import { TrendingUp, TrendingDown, Receipt, MoreVertical, Edit2, Trash2, Plus } from 'lucide-react';
import { FinancialEmptyState } from './financial-empty-state';
import type { Invoice } from '@/features/invoices/types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';

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
  onViewDetails: (id: number) => void;
  userRole?: string;
  onAddInvoice?: (expenseId: number) => void;
  onEditExpense?: (expenseId: number) => void;
  onDeleteExpense?: (expenseId: number) => void;
};

export function TransactionsTable({
  data,
  type,
  invoices = [],
  onViewDetails,
  userRole,
  onAddInvoice,
  onEditExpense,
  onDeleteExpense,
}: TransactionsTableProps) {
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
            <div
              key={item.id}
              onClick={() => onViewDetails(item.id)}
              className="bg-card border border-border rounded-lg p-4 shadow-finance flex flex-col justify-between hover:border-accent-gold/40 cursor-pointer transition-all duration-200"
            >
              <div>
                <div className="flex justify-between items-start gap-2.5">
                  <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-normal">
                    {type === 'revenues' ? item.statement : item.description}
                  </h4>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-xs font-bold font-mono ${type === 'revenues' ? 'text-success' : 'text-destructive'}`}>
                      {type === 'revenues' ? '+' : '-'}{formatNumber(item.amount)} <span className="text-[10px] font-semibold text-muted-foreground mx-1">{currencySymbol}</span>
                    </span>
                    {type === 'expenses' && ['engineer', 'employee'].includes(userRole || '') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 h-7 w-7 p-0 text-muted-foreground hover:text-foreground focus-visible:ring-0"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                          {onAddInvoice && (
                            <DropdownMenuItem onClick={() => onAddInvoice(item.id)}>
                              <Plus className="ml-2 size-4 text-muted-foreground" />
                              <span>إضافة فاتورة</span>
                            </DropdownMenuItem>
                          )}
                          {onEditExpense && (
                            <DropdownMenuItem onClick={() => onEditExpense(item.id)}>
                              <Edit2 className="ml-2 size-4 text-muted-foreground" />
                              <span>تعديل</span>
                            </DropdownMenuItem>
                          )}
                          {onDeleteExpense && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => onDeleteExpense(item.id)}
                            >
                              <Trash2 className="ml-2 size-4" />
                              <span>حذف</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {type === 'expenses' && expenseInvoices.length > 0 && (
                  <div className="w-full mt-3 flex items-center justify-between text-[10px] text-primary bg-primary/10 py-1.5 px-2.5 rounded-md border border-primary/20 font-semibold">
                    <span className="flex items-center gap-1">
                      <Receipt className="size-3 text-primary" />
                      <span>الفواتير المرتبطة ({expenseInvoices.length})</span>
                    </span>
                    <span className="text-[9px] text-primary">عرض التفاصيل ←</span>
                  </div>
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
    </div>
  );
}
