import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { InvoicesTable } from './components/invoices.table';
import { InvoicesDialog } from './components/invoices.dialog';

export function InvoicesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Header */}
      <PageHeader
        badge="INVOICES"
        title="الفواتير"
        icon={FileText}
        action={
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="h-11 bg-slate-950 px-6 text-white shadow-md hover:bg-slate-800 focus:ring-slate-950 sm:w-auto w-full"
          >
            <Plus className="mr-2 size-4" />
            إضافة فاتورة
          </Button>
        }
      />

      {/* Main Content (Table) */}
      <InvoicesTable />

      <InvoicesDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}

export default InvoicesPage;
