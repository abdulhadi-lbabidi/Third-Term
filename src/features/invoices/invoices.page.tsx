import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { InvoicesTable } from './components/invoices.table';

export function InvoicesPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col flex-1 gap-4 w-full">
      {/* Header */}
      <PageHeader
        badge="INVOICES"
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

      {/* Main Content (Table) */}
      <InvoicesTable />
    </div>
  );
}

export default InvoicesPage;
