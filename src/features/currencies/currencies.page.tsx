import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { CurrencyTable } from './components/currency.table';
import { CurrencyDialog } from './components/currency.dialog';
import type { Currency, CreateCurrencyPayload } from './types';
import { useCurrencies, useMutateCurrency, useDeleteCurrency } from './currencies.hooks';
import { PageHeader } from '../components/page-header';
import { Banknote, Search, RotateCcw } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

export function CurrenciesPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

  const { data: response, isLoading: loading } = useCurrencies(page, perPage, sort, search);
  const { mutateAsync: saveCurrency, isPending: isSaving } = useMutateCurrency();
  const { mutateAsync: deleteCurrency } = useDeleteCurrency();

  const handleSearchSubmit = () => {
    setSearch(searchQuery);
    setPage(1);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearch('');
    setPage(1);
  };

  const handleCreateOrUpdate = async (payload: CreateCurrencyPayload) => {
    await saveCurrency({ id: selectedCurrency?.id, payload });
    setDialogOpen(false);
  };

  const handleDelete = async (currency: Currency) => {
    await deleteCurrency(currency.id);
  };

  const openCreateDialog = () => {
    setSelectedCurrency(null);
    setDialogOpen(true);
  };

  const openEditDialog = (currency: Currency) => {
    setSelectedCurrency(currency);
    setDialogOpen(true);
  };

  const currencies = response?.data ?? [];
  const meta = response?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="المالية"
        title="العملات"
        icon={Banknote}
        action={
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground inline-flex items-center justify-center p-0 border-none bg-transparent cursor-pointer"
              >
                <Search className="size-4" />
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit();
                  }
                }}
                placeholder="ابحث باسم العملة أو الرمز..."
                className="w-full bg-card border border-input rounded-md pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/25 focus:border-ring transition-all"
              />
            </div>
            {searchQuery && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="!p-2 !py-1 !h-8"
              >
                <RotateCcw className="size-4" />
              </Button>
            )}
            <Button onClick={openCreateDialog}>إضافة عملة جديدة</Button>
          </div>
        }
      />

      <CurrencyTable
        data={currencies}
        loading={loading}
        sort={sort}
        onSortChange={setSort}
        onEdit={openEditDialog}
        onDelete={handleDelete}
      />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
        limit={perPage}
        limitOptions={[5, 10, 20, 50, 100]}
        onLimitChange={setPerPage}
      />

      <CurrencyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currency={selectedCurrency}
        onSubmit={handleCreateOrUpdate}
        loading={isSaving}
      />
    </div>
  );
}
