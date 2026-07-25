import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { currenciesApi } from './currencies.api';
import { CurrencyTable } from './components/currency.table';
import { CurrencyDialog } from './components/currency.dialog';
import type { Currency, CreateCurrencyPayload } from './types';

export function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const data = await currenciesApi.getCurrencies();
      setCurrencies(data);
    } catch {
      toast.error('تعذر جلب العملات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCurrencies();
  }, []);

  const handleCreateOrUpdate = async (payload: CreateCurrencyPayload) => {
    setSubmitting(true);
    try {
      if (selectedCurrency) {
        const updated = await currenciesApi.updateCurrency(selectedCurrency.id, payload);
        setCurrencies((prev) => prev.map((currency) => (currency.id === updated.id ? updated : currency)));
        toast.success('تم تعديل العملة بنجاح');
      } else {
        const created = await currenciesApi.createCurrency(payload);
        setCurrencies((prev) => [...prev, created]);
        toast.success('تم إنشاء العملة بنجاح');
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'تعذر حفظ العملة');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (currency: Currency) => {
    try {
      await currenciesApi.deleteCurrency(currency.id);
      setCurrencies((prev) => prev.filter((item) => item.id !== currency.id));
      toast.success('تم حذف العملة بنجاح');
    } catch {
      toast.error('تعذر حذف العملة');
    }
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
        loading={submitting}
      />
    </div>
  );
}
