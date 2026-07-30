import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { currenciesApi } from '@/features/currencies/currencies.api';
import { companyFundsApi, type CompanyFundResponse } from './company-funds.api';
import { CompanyFundsDialog } from './components/company-funds.dialog';
import { CompanyFundsTable } from './components/company-funds.table';
import { AttachCurrencyDialog } from './components/attach-currency.dialog';
import { CompanyFundCurrenciesDialog } from './components/company-fund-currencies.dialog';
import { CompanyFundCurrencyDialog } from './components/company-fund-currency.dialog';
import type { CompanyFund, CompanyFundCurrency, CreateCompanyFundPayload } from './types';
import { PageHeader } from '../components/page-header';
import { Wallet } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

export function CompanyFundsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 50;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [currenciesDialogOpen, setCurrenciesDialogOpen] = useState(false);
  const [currencyEditDialogOpen, setCurrencyEditDialogOpen] = useState(false);
  const [selectedCompanyFund, setSelectedCompanyFund] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundForCurrency, setSelectedCompanyFundForCurrency] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundForView, setSelectedCompanyFundForView] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundCurrency, setSelectedCompanyFundCurrency] = useState<CompanyFundCurrency | null>(null);

  const companyFundsQuery = useQuery<CompanyFundResponse>({
    queryKey: ['company-funds', page, perPage],
    queryFn: () => companyFundsApi.getCompanyFunds(page, perPage),
  });

  const currenciesQuery = useQuery({
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
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      setDialogOpen(false);
      setSelectedCompanyFund(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fund: CompanyFund) => companyFundsApi.deleteCompanyFund(fund.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
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
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
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
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
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

  const handleAttachCurrency = async (payload: { currency_id: number; balance: string }) => {
    await attachMutation.mutateAsync(payload);
    toast.success('تم حفظ العملة بصندوق الشركة بنجاح');
  };

  const companyFunds = companyFundsQuery.data?.data ?? [];
  const meta = companyFundsQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="المالية"
        title="صندوق الشركة"
        icon={Wallet}
        action={
          <Button
            onClick={() => {
              setSelectedCompanyFund(null);
              setDialogOpen(true);
            }}
          >
            إضافة صندوق الشركة
          </Button>
        }
      />

      <CompanyFundsTable
        data={companyFunds}
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
        onMoreCurrenciesClick={(fund) => {
          setSelectedCompanyFundForView(fund);
          setCurrenciesDialogOpen(true);
        }}
      />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
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
        currencies={currenciesQuery.data?.data ?? (Array.isArray(currenciesQuery.data) ? currenciesQuery.data : [])}
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
