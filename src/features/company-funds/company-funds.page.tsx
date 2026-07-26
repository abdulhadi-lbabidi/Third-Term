import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { currenciesApi } from '@/features/currencies/currencies.api';
import type { Currency } from '@/features/currencies/types';
import { companyFundsApi } from './company-funds.api';
import { CompanyFundsDialog } from './components/company-funds.dialog';
import { CompanyFundsTable } from './components/company-funds.table';
import { AttachCurrencyDialog } from './components/attach-currency.dialog';
import type { CompanyFund, CreateCompanyFundPayload } from './types';
import { PageHeader } from '../components/page-header';

const companyFundsQueryKeys = {
  all: ['company-funds'] as const,
};

export function CompanyFundsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [selectedCompanyFund, setSelectedCompanyFund] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundForCurrency, setSelectedCompanyFundForCurrency] = useState<CompanyFund | null>(null);

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

  const handleSubmit = async (payload: CreateCompanyFundPayload) => {
    await saveMutation.mutateAsync(payload);
    toast.success(selectedCompanyFund ? 'تم تعديل صندوق الشركة بنجاح' : 'تم إنشاء صندوق الشركة بنجاح');
  };

  const handleDelete = async (fund: CompanyFund) => {
    await deleteMutation.mutateAsync(fund);
    toast.success('تم حذف صندوق الشركة بنجاح');
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
    </div>
  );
}
