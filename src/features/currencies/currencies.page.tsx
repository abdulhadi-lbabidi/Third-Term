import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { CurrencyTable } from './components/currency.table';
import { CurrencyDialog } from './components/currency.dialog';
import type { Currency, CreateCurrencyPayload } from './types';
import { useCurrencies, useMutateCurrency, useDeleteCurrency } from './currencies.hooks';

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
      <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              المالية
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">العملات</h1>
          </div>
          <Button
            onClick={openCreateDialog}
            className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
          >
            إضافة عملة جديدة
          </Button>
        </div>
      </div>

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
