import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, FileX, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { InvoicesTable } from './components/invoices.table';
import { FilterDrawer } from '@/shared/components/ui/filter-drawer';
import { InvoicesFilterForm } from './components/invoices-filter.form';
import { cn } from '@/shared/lib/utils';
import { INVOICES_KEYS, useBulkUpdateInvoiceIsPosted } from './invoices.hooks';
import { InvoicesDialog } from './components/invoices.dialog';

export function UnpostedInvoicesPage() {
  const queryClient = useQueryClient();
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { mutate: bulkUpdateIsPosted, isPending: isPosting } = useBulkUpdateInvoiceIsPosted();

  const handleBulkPost = () => {
    if (selectedIds.length === 0) return;
    bulkUpdateIsPosted(
      { ids: selectedIds, is_posted: true },
      {
        onSuccess: () => {
          setSelectedIds([]);
        },
      }
    );
  };

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expenseId, setExpenseId] = useState<number | ''>('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [itemId, setItemId] = useState<number | ''>('');

  const [sort, setSort] = useState<string | undefined>(undefined);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({
    'filter[is_posted]': false,
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      'filter[search]': searchQuery || undefined,
      'filter[expense_id]': expenseId || undefined,
      'filter[supplier_id]': supplierId || undefined,
      'filter[item_id]': itemId || undefined,
      'filter[is_posted]': false,
    });
    setSelectedIds([]);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setExpenseId('');
    setSupplierId('');
    setItemId('');
    setAppliedFilters({
      'filter[is_posted]': false,
    });
    setSelectedIds([]);
    queryClient.invalidateQueries({
      queryKey: INVOICES_KEYS.lists(),
    });
  };

  const hasActiveCustomFilters = Object.entries(appliedFilters).some(
    ([key, val]) => key !== 'filter[is_posted]' && Boolean(val)
  );

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-4 sm:gap-5">
      <PageHeader
        badge="الإدارة المالية"
        title="الفواتير الغير مرحلة"
        icon={FileX}
        action={
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
            {(hasActiveCustomFilters || sort) ? (
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
                hasActiveCustomFilters && "border-primary text-primary",
              )}
            >
              <SlidersHorizontal className="size-4" />
              فلترة متقدمة
            </Button>
            {selectedIds.length > 0 && (
              <Button
                type="button"
                onClick={handleBulkPost}
                disabled={isPosting}
                className="h-10 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:h-11 sm:px-6 shadow-md"
              >
                {isPosting ? 'جاري الترحيل...' : `ترحيل الفواتير المحددة (${selectedIds.length})`}
              </Button>
            )}
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
          <h2 className="text-base font-semibold text-slate-900">سجل الفواتير الغير مرحلة</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            عرض وإدارة الفواتير التي لم يتم ترحيلها بعد وتفاصيلها المالية.
          </p>
        </div>
        <InvoicesTable
          filters={appliedFilters}
          sort={sort}
          onSortChange={setSort}
          perPage={50}
          showSelection={true}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </section>
    </div>
  );
}

export default UnpostedInvoicesPage;
