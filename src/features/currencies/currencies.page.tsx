import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { CurrencyTable } from './components/currency.table';
import { CurrencyDialog } from './components/currency.dialog';
import type { Currency, CreateCurrencyPayload } from './types';
import { useCurrencies, useMutateCurrency, useDeleteCurrency } from './currencies.hooks';
import { PageHeader } from '../components/page-header';
import { Banknote } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

export function CurrenciesPage() {
  const [page, setPage] = useState(1);
  const perPage = 50;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

  const { data: response, isLoading: loading } = useCurrencies(page, perPage);
  const { mutateAsync: saveCurrency, isPending: isSaving } = useMutateCurrency();
  const { mutateAsync: deleteCurrency } = useDeleteCurrency();

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
          <Button onClick={openCreateDialog}>إضافة عملة جديدة</Button>
        }
      />

      <CurrencyTable
        data={currencies}
        loading={loading}
        onEdit={openEditDialog}
        onDelete={handleDelete}
      />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
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
