import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { currenciesApi } from '@/features/currencies/currencies.api';
import type { Currency } from '@/features/currencies/types';
import { companyFundsApi } from './company-funds.api';
import { CompanyFundsDialog } from './components/company-funds.dialog';
import { CompanyFundsTable } from './components/company-funds.table';
import { AttachCurrencyDialog } from './components/attach-currency.dialog';
import { CompanyFundCurrenciesDialog } from './components/company-fund-currencies.dialog';
import { CompanyFundCurrencyDialog } from './components/company-fund-currency.dialog';
import type { CompanyFund, CompanyFundCurrency, CreateCompanyFundPayload } from './types';
import { PageHeader } from '../components/page-header';

const companyFundsQueryKeys = {
  all: ['company-funds'] as const,
};

export function CompanyFundsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [currenciesDialogOpen, setCurrenciesDialogOpen] = useState(false);
  const [currencyEditDialogOpen, setCurrencyEditDialogOpen] = useState(false);
  const [selectedCompanyFund, setSelectedCompanyFund] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundForCurrency, setSelectedCompanyFundForCurrency] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundForView, setSelectedCompanyFundForView] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundCurrency, setSelectedCompanyFundCurrency] = useState<CompanyFundCurrency | null>(null);

  const companyFundsQuery = useQuery<CompanyFund[]>({
    queryKey: companyFundsQueryKeys.all,
    queryFn: () => companyFundsApi.getCompanyFunds(),
  });

  const currenciesQuery = useQuery<Currency[]>({
    queryKey: ['currencies'] as const,
    queryFn: () => currenciesApi.getAll(),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateCompanyFundPayload) => {
      if (selectedCompanyFund) {
        return companyFundsApi.updateCompanyFund(selectedCompanyFund.id, { name: payload.name });
      }
      return companyFundsApi.createCompanyFund(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyFundsQueryKeys.all });
      setDialogOpen(false);
      setSelectedCompanyFund(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fund: CompanyFund) => companyFundsApi.deleteCompanyFund(fund.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyFundsQueryKeys.all });
    },
  });

  const attachMutation = useMutation({
    mutationFn: async (payload: { currency_id: number; balance: string }) => {
      if (!selectedCompanyFundForCurrency) {
        throw new Error('صندوق الشركة غير محدد');
      }
      return companyFundsApi.attachCurrency(selectedCompanyFundForCurrency.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyFundsQueryKeys.all });
      setAttachDialogOpen(false);
      setSelectedCompanyFundForCurrency(null);
    },
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: async (payload: { currency_id: number; balance: string }) => {
      if (!selectedCompanyFund) {
        throw new Error('صندوق الشركة غير محدد');
      }
      return companyFundsApi.attachCurrency(selectedCompanyFund.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyFundsQueryKeys.all });
      setCurrencyEditDialogOpen(false);
      setSelectedCompanyFundCurrency(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء تعديل العملة');
    },
  });

  const handleSubmit = async (payload: CreateCompanyFundPayload) => {
    await saveMutation.mutateAsync(payload);
    toast.success(selectedCompanyFund ? 'تم تعديل صندوق الشركة بنجاح' : 'تم إنشاء صندوق الشركة بنجاح');
  };

  const handleDelete = async (fund: CompanyFund) => {
    await deleteMutation.mutateAsync(fund);
    toast.success('تم حذف صندوق الشركة بنجاح');
  };

  const openCurrencyEditDialog = (fund: CompanyFund, currencyId: number) => {
    const currency = fund.currencies?.find((item) => item.id === currencyId) ?? null;
    setSelectedCompanyFund(fund);
    setSelectedCompanyFundCurrency(currency);
    setCurrencyEditDialogOpen(true);
  };

  const handleAttachCurrency = async (payload: { currency_id: number; balance: string }) => {
    await attachMutation.mutateAsync(payload);
    toast.success('تم حفظ العملة بصندوق الشركة بنجاح');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        badge="المالية"
        title="صندوق الشركة"
        action={
          <Button
            onClick={() => {
              setSelectedCompanyFund(null);
              setDialogOpen(true);
            }}
            className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
          >
            إضافة صندوق الشركة
          </Button>
        }
      />

      <CompanyFundsTable
        data={companyFundsQuery.data ?? []}
        loading={companyFundsQuery.isLoading}
        onEdit={(fund) => {
          setSelectedCompanyFund(fund);
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
        onAttachCurrency={(fund) => {
          setSelectedCompanyFundForCurrency(fund);
          setAttachDialogOpen(true);
        }}
        onCurrencyClick={openCurrencyEditDialog}
        onMoreCurrenciesClick={(fund) => {
          setSelectedCompanyFundForView(fund);
          setCurrenciesDialogOpen(true);
        }}
      />

      <CompanyFundsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companyFund={selectedCompanyFund}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />

      <AttachCurrencyDialog
        open={attachDialogOpen}
        onOpenChange={(open) => {
          setAttachDialogOpen(open);
          if (!open) {
            setSelectedCompanyFundForCurrency(null);
          }
        }}
        currencies={currenciesQuery.data ?? []}
        onSubmit={handleAttachCurrency}
        loading={attachMutation.isPending}
      />

      <CompanyFundCurrenciesDialog
        open={currenciesDialogOpen}
        onOpenChange={(open) => {
          setCurrenciesDialogOpen(open);
          if (!open) setSelectedCompanyFundForView(null);
        }}
        fund={selectedCompanyFundForView}
        onCurrencyClick={openCurrencyEditDialog}
      />

      <CompanyFundCurrencyDialog
        open={currencyEditDialogOpen}
        onOpenChange={(open) => {
          setCurrencyEditDialogOpen(open);
          if (!open) setSelectedCompanyFundCurrency(null);
        }}
        currency={selectedCompanyFundCurrency}
        onSubmit={async (payload) => {
          await updateCurrencyMutation.mutateAsync(payload);
          toast.success('تم تعديل العملة بنجاح');
        }}
        loading={updateCurrencyMutation.isPending}
      />
    </div>
  );
}

