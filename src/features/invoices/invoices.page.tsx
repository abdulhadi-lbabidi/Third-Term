import { useState } from 'react';
import { Plus, ReceiptText } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { InvoicesTable } from './components/invoices.table';
import { InvoicesDialog } from './components/invoices.dialog';

export function InvoicesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <ReceiptText className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                INVOICES
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">الفواتير</h1>
          </div>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="h-11 bg-slate-950 px-6 text-white shadow-md hover:bg-slate-800 focus:ring-slate-950 sm:w-auto w-full"
        >
          <Plus className="mr-2 size-4" />
          إضافة فاتورة
        </Button>
      </div>

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
