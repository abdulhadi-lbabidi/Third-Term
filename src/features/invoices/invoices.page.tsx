import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { InvoicesTable } from './components/invoices.table';

export function InvoicesPage() {
  const navigate = useNavigate();

  return (
    <div className="flex w-full flex-1 flex-col gap-5">
      <PageHeader
        badge="الإدارة المالية"
        title="الفواتير"
        icon={FileText}
        action={
          <Button
            onClick={() => navigate('/invoices/new')}
            className="h-11 bg-slate-950 px-6 text-white shadow-md hover:bg-slate-800 focus:ring-slate-950 sm:w-auto w-full"
          >
            <Plus className="mr-2 size-4" />
            إضافة فاتورة
          </Button>
        }
      />

      <section className="surface-panel min-w-0 space-y-4 p-4 sm:p-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">سجل الفواتير</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            إدارة الفواتير المرتبطة بالمصروفات والموردين، وعرض أصناف كل فاتورة وتفاصيلها المالية.
          </p>
        </div>
        <InvoicesTable perPage={10} />
      </section>
    </div>
  );
}

export default InvoicesPage;
