import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { InvoicesTable } from './components/invoices.table';
import { FilterDrawer } from '@/shared/components/ui/filter-drawer';
import { InvoicesFilterForm } from './components/invoices-filter.form';
import { cn } from '@/shared/lib/utils';
import { INVOICES_KEYS } from './invoices.hooks';
import { InvoicesDialog } from './components/invoices.dialog';

export function InvoicesPage() {
  const queryClient = useQueryClient();
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expenseId, setExpenseId] = useState<number | ''>('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [itemId, setItemId] = useState<number | ''>('');

  const [sort, setSort] = useState<string | undefined>(undefined);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});

  const handleApplyFilters = () => {
    setAppliedFilters({
      'filter[search]': searchQuery || undefined,
      'filter[expense_id]': expenseId || undefined,
      'filter[supplier_id]': supplierId || undefined,
      'filter[item_id]': itemId || undefined,
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setExpenseId('');
    setSupplierId('');
    setItemId('');
    setAppliedFilters({});
    queryClient.invalidateQueries({
      queryKey: INVOICES_KEYS.lists(),
    });
  };

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-4 sm:gap-5">
      <PageHeader
        badge="الإدارة المالية"
        title="الفواتير"
        icon={FileText}
        action={
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
            {(Object.values(appliedFilters).some(Boolean) || sort) ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  handleResetFilters();
                  setSort(undefined);
                }}
                aria-label="إعادة ضبط الفلاتر"
                title="إعادة ضبط الفلاتر"
              >
                <RotateCcw className="size-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className={cn(
                "h-10 shrink-0 px-3 sm:h-11 sm:px-4",
                Object.values(appliedFilters).some(Boolean) && "border-primary text-primary",
              )}
            >
              <SlidersHorizontal className="size-4" />
              فلترة متقدمة
            </Button>
            <Button
              onClick={() => setInvoiceDialogOpen(true)}
              className="h-10 shrink-0 px-3 shadow-md sm:h-11 sm:px-6"
            >
              <Plus className="mr-2 size-4" />
              إضافة فاتورة
            </Button>
          </div>
        }
      />

      <InvoicesDialog isOpen={invoiceDialogOpen} onClose={() => setInvoiceDialogOpen(false)} />

      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      >
        <InvoicesFilterForm
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          expenseId={expenseId}
          setExpenseId={setExpenseId}
          supplierId={supplierId}
          setSupplierId={setSupplierId}
          itemId={itemId}
          setItemId={setItemId}
        />
      </FilterDrawer>

      <section className="surface-panel min-w-0 space-y-4 p-3 sm:p-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">سجل الفواتير</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            إدارة الفواتير المرتبطة بالمصروفات والموردين، وعرض أصناف كل فاتورة وتفاصيلها المالية.
          </p>
        </div>
        <InvoicesTable
          filters={appliedFilters}
          sort={sort}
          onSortChange={setSort}
          perPage={50}
        />
      </section>
    </div>
  );
}

export default InvoicesPage;
