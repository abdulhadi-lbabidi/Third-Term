import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/features/components/page-header';
import { InvoicesForm } from './components/invoices.form';
import { FileText } from 'lucide-react';
import { useInvoice } from './invoices.hooks';

export function NewInvoicePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const invoiceId = Number(searchParams.get('invoiceId') || '');
  const isEditMode = Number.isFinite(invoiceId) && invoiceId > 0;

  const { data: invoice, isLoading } = useInvoice(invoiceId, isEditMode);
  const isPublicPath = window.location.pathname.startsWith('/public');
  const projectId = searchParams.get('projectId');
  const projectFundId = searchParams.get('projectFundId');
  const expenseId = searchParams.get('expenseId') ? Number(searchParams.get('expenseId')) : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        badge="الفواتير"
        title={isEditMode ? 'تحديث الفاتورة' : 'إضافة فاتورة جديدة'}
        icon={FileText}
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (isPublicPath) {
                navigate(projectId ? `/public/projects/${projectId}?tab=invoices` : '/public/projects');
              } else {
                navigate('/invoices');
              }
            }}
          >
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
            projectId={projectId ? Number(projectId) : undefined}
            projectFundId={projectFundId ? Number(projectFundId) : undefined}
            fixedValues={expenseId ? { expense_id: expenseId } : undefined}
            onSuccess={async (savedInvoice) => {
              await queryClient.invalidateQueries({ queryKey: ['public-invoices'] });
              await queryClient.invalidateQueries({ queryKey: ['public-project-details'] });
              if (isPublicPath) {
                navigate(projectId ? `/public/projects/${projectId}?tab=invoices` : '/public/projects', { replace: true });
              } else if (!isEditMode && savedInvoice?.id) {
                navigate(`/invoice-items?invoiceId=${savedInvoice.id}&wizard=true`, { replace: true });
              } else {
                navigate('/invoices', { replace: true });
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
