import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { CurrencyTable } from './components/currency.table';
import { CurrencyDialog } from './components/currency.dialog';
import type { Currency, CreateCurrencyPayload } from './types';
import { useCurrencies, useMutateCurrency, useDeleteCurrency } from './currencies.hooks';
import { PageHeader } from '../components/page-header';

export function CurrenciesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

  const { data: currencies = [], isLoading: loading } = useCurrencies();
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

  return (
    <div className="space-y-5">
      <PageHeader
        badge="المالية"
        title="العملات"
        action={
          <Button
            onClick={openCreateDialog}
            className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
          >
            إضافة عملة جديدة
          </Button>
        }
      />

      <CurrencyTable
        data={currencies}
        loading={loading}
        onEdit={openEditDialog}
        onDelete={handleDelete}
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
