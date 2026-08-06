import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/features/components/page-header';
import { InvoicesDialog } from './components/invoices.dialog';
import { FileText } from 'lucide-react';

export function NewInvoicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = Number(searchParams.get('invoiceId') || '');
  const isEditMode = Number.isFinite(invoiceId) && invoiceId > 0;

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

      <InvoicesDialog
        isOpen
        embedded
        invoiceId={isEditMode ? invoiceId : undefined}
        onClose={() => navigate('/invoices', { replace: true })}
      />
    </div>
  );
}
