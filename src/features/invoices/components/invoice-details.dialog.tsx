import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import { format } from 'date-fns';
import { useInvoice } from '../invoices.hooks';
import { Skeleton } from '@/shared/components/ui/skeleton';

type InvoiceDetailsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number | null;
};

export function InvoiceDetailsDialog({ isOpen, onClose, invoiceId }: InvoiceDetailsDialogProps) {
  const { data: invoice, isLoading } = useInvoice(invoiceId as number, !!invoiceId);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isLoading ? <Skeleton className="h-7 w-64" /> : `تفاصيل الفاتورة - ${invoice?.invoice_number || `#${invoice?.id}`}`}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !invoice ? (
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full max-w-[200px]" />
                </div>
              ))}
            </div>
            <div className="border-t pt-4 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-slate-500">التاريخ</span>
                <p className="font-medium text-slate-900">
                  {invoice.date ? format(new Date(invoice.date), 'yyyy-MM-dd') : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-slate-500">تاريخ الإنشاء</span>
                <p className="font-medium text-slate-900">
                  {invoice.created_at ? format(new Date(invoice.created_at), 'yyyy-MM-dd') : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-slate-500">الحالة</span>
                <div>
                  <Badge variant={invoice.is_posted ? 'default' : 'secondary'} className={invoice.is_posted ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}>
                    {invoice.is_posted ? 'مرحل' : 'غير مرحل'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-slate-500">المورد</span>
                <p className="font-medium text-slate-900">
                  {typeof invoice.supplier === 'string' ? invoice.supplier : invoice.supplier?.name || '-'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-slate-500">المادة (البند)</span>
                <p className="font-medium text-slate-900">
                  {typeof invoice.item === 'string' ? invoice.item : invoice.item?.name || '-'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-slate-500">النفقة المرتبطة</span>
                <p className="font-medium text-slate-900">
                  {invoice.expense_description || invoice.expense?.description || '-'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-slate-500">مرئية للعميل؟</span>
                <p className="font-medium text-slate-900">{invoice.is_visible_to_client ? 'نعم' : 'لا'}</p>
              </div>
            </div>

            <div className="border-t pt-4 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div className="space-y-1">
                <span className="text-sm text-slate-500">الخصم</span>
                <p className="font-medium text-slate-900">{Number(invoice.discount || 0).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-slate-500">الإجمالي النهائي</span>
                <p className="text-lg font-bold text-emerald-600">{Number(invoice.final_total || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
