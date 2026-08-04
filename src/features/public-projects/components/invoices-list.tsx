import { FileText } from 'lucide-react';
import { FinancialEmptyState } from './financial-empty-state';
import type { Invoice } from '@/features/invoices/types';

type InvoicesListProps = {
  data: Invoice[];
};

export function InvoicesList({ data }: InvoicesListProps) {
  const formatNumber = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-US').format(num);
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
      {data.map((invoice) => {
        const supplierName = typeof invoice.supplier === 'string'
          ? invoice.supplier
          : invoice.supplier?.name;
        const itemName = typeof invoice.item === 'string'
          ? invoice.item
          : invoice.item?.name;

        return (
          <div key={invoice.id} className="bg-card border border-border rounded-lg p-4 shadow-finance flex flex-col justify-between hover:border-accent-gold/40 transition-all duration-200">
            <div>
              <div className="flex justify-between items-start gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-info/10 text-info rounded-md">
                    <FileText className="size-4 text-current" />
                  </div>
                  <h4 className="text-xs font-semibold text-foreground">
                    فاتورة #{invoice.invoice_number}
                  </h4>
                </div>
                <span className="shrink-0 text-xs sm:text-sm font-bold font-mono text-primary">
                  {formatNumber(invoice.final_total)}
                </span>
              </div>

              {(itemName || supplierName) && (
                <div className="mt-2.5 space-y-1 text-[10px] text-muted-foreground border-t border-border/40 pt-2">
                  {itemName && (
                    <div className="flex justify-between">
                      <span>البند:</span>
                      <span className="font-semibold text-foreground text-right">{itemName}</span>
                    </div>
                  )}
                  {supplierName && (
                    <div className="flex justify-between">
                      <span>المورد:</span>
                      <span className="font-semibold text-foreground text-right">{supplierName}</span>
                    </div>
                  )}
                </div>
              )}

              {invoice.expense && (
                <div className="mt-3 bg-destructive/5 border border-destructive/10 rounded-md p-2 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                    <span className="text-muted-foreground shrink-0">المصروف:</span>
                    <span className="font-semibold text-foreground truncate" title={invoice.expense.description}>
                      {invoice.expense.description}
                    </span>
                  </div>
                  <span className="font-bold font-mono text-destructive shrink-0 mr-2">
                    {formatNumber(invoice.expense.amount)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="pt-2.5 border-t border-border mt-4 flex items-center justify-between text-[9px] text-muted-foreground">
              <div>
                <span>الخصم: </span>
                <span className="text-destructive font-semibold font-mono">{formatNumber(invoice.discount) !== '٠' ? `-${formatNumber(invoice.discount)}` : '0'}</span>
              </div>
              <span className="font-semibold">{invoice.date}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

