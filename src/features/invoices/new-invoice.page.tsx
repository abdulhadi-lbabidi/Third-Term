import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/features/components/page-header';
import { InvoicesForm } from './components/invoices.form';
import { FileText } from 'lucide-react';
import { useInvoice } from './invoices.hooks';

export function NewInvoicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = Number(searchParams.get('invoiceId') || '');
  const isEditMode = Number.isFinite(invoiceId) && invoiceId > 0;

  const { data: invoice, isLoading } = useInvoice(invoiceId, isEditMode);

  return (
    <div className="space-y-5">
      <PageHeader
        badge="الفواتير"
        title={isEditMode ? 'تحديث الفاتورة' : 'إضافة فاتورة جديدة'}
        icon={FileText}
        action={
          <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>
            رجوع
          </Button>
        }
      />

      <div className="surface-panel p-5 sm:p-6">
        {(isEditMode && isLoading) ? (
          <div className="flex items-center justify-center p-8">جاري التحميل...</div>
        ) : (
          <InvoicesForm
            defaultValues={isEditMode ? invoice : undefined}
            onSuccess={() => navigate('/invoices', { replace: true })}
          />
        )}
      </div>
    </div>
  );
}
