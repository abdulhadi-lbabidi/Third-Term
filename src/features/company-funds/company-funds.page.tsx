import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Wallet } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { currenciesApi } from '@/features/currencies/currencies.api';
import { companyFundsApi } from './company-funds.api';
import { GenericFundDetails } from '@/features/funds-shared/components/generic-fund-details';
import { GenericFundCard } from '@/features/funds-shared/components/generic-fund.card';
import { GenericFundDialog } from '@/features/funds-shared/components/generic-fund.dialog';
import { AttachCurrencyDialog } from '@/features/funds-shared/components/attach-currency.dialog';
import { GenericFundCurrenciesDialog } from '@/features/funds-shared/components/generic-fund-currencies.dialog';
import { GenericFundCurrencyDialog } from '@/features/funds-shared/components/generic-fund-currency.dialog';
import type { CompanyFund, CompanyFundCurrency } from './types';
import { PageHeader } from '../components/page-header';
import { cn } from '@/shared/lib/utils';

const companyFundsQueryKeys = {
  all: ['company-funds'] as const,
  detail: (id: number) => [...companyFundsQueryKeys.all, id] as const,
};

export function CompanyFundsPage({ isTab = false }: { isTab?: boolean }) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedFundId = searchParams.get('fundId') ? Number(searchParams.get('fundId')) : null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [currenciesDialogOpen, setCurrenciesDialogOpen] = useState(false);
  const [currencyEditDialogOpen, setCurrencyEditDialogOpen] = useState(false);

  const [selectedCompanyFund, setSelectedCompanyFund] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundForCurrency, setSelectedCompanyFundForCurrency] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundForView, setSelectedCompanyFundForView] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundCurrency, setSelectedCompanyFundCurrency] = useState<CompanyFundCurrency | null>(null);

  const companyFundsQuery = useQuery({
    queryKey: companyFundsQueryKeys.all,
    queryFn: async () => {
      const response = await companyFundsApi.getCompanyFunds();
      return response.data;
    },
  });

  const currenciesQuery = useQuery({
    queryKey: ['currencies'] as const,
    queryFn: () => currenciesApi.getAll(),
  });

  const fundDetailsQuery = useQuery({
    queryKey: companyFundsQueryKeys.detail(selectedFundId!),
    queryFn: () => companyFundsApi.getCompanyFundById(selectedFundId!),
    enabled: !!selectedFundId,
  });

  const currentFund = fundDetailsQuery.data || companyFundsQuery.data?.find((f) => f.id === selectedFundId) || null;

  const saveMutation = useMutation({
    mutationFn: async (payload: { name: string }) => {
      if (selectedCompanyFund) {
        return companyFundsApi.updateCompanyFund(selectedCompanyFund.id, { name: payload.name });
      }
      return companyFundsApi.createCompanyFund(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyFundsQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['fund-details'] });
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
      const fund = selectedCompanyFundForCurrency || selectedCompanyFund;
      if (!fund) throw new Error('صندوق الشركة غير محدد');
      return companyFundsApi.attachCurrency(fund.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyFundsQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['fund-details'] });
      setAttachDialogOpen(false);
      setSelectedCompanyFundForCurrency(null);
      setSelectedCompanyFund(null);
    },
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: async (payload: { currency_id: number; balance: string }) => {
      if (!selectedCompanyFund) throw new Error('صندوق الشركة غير محدد');
      return companyFundsApi.attachCurrency(selectedCompanyFund.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: companyFundsQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['fund-details'] });
      setCurrencyEditDialogOpen(false);
      setSelectedCompanyFundCurrency(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء تعديل العملة');
    },
  });

  const handleSubmit = async (payload: { name: string }) => {
    await saveMutation.mutateAsync(payload);
    toast.success(selectedCompanyFund ? 'تم تعديل صندوق الشركة بنجاح' : 'تم إنشاء صندوق الشركة بنجاح');
  };

  const handleDelete = async (fund: CompanyFund) => {
    await deleteMutation.mutateAsync(fund);
    toast.success('تم حذف صندوق الشركة بنجاح');
    if (selectedFundId === fund.id) {
      setSearchParams((prev) => {
        prev.delete('fundId');
        return prev;
      });
    }
  };

  const handleAttachCurrency = async (payload: { currency_id: number; balance: number }) => {
    await attachMutation.mutateAsync({ ...payload, balance: payload.balance.toString() });
    toast.success('تم حفظ العملة بصندوق الشركة بنجاح');
  };

  return (
    <div className={cn("space-y-5", isTab && "space-y-0")}>
      {!selectedFundId ? (
        <>
          {!isTab && (
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
          )}
          <div className='flex bg-white '>
            {companyFundsQuery.isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-[200px] rounded-lg border border-border bg-card animate-pulse" />
                ))}
              </div>
            ) : (companyFundsQuery.data ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
                <Wallet className="mb-4 size-10 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">لا توجد صناديق</h4>
                <p className="mt-1 mb-4 max-w-sm text-sm text-muted-foreground">
                  لم يتم إضافة أي صناديق شركة بعد.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCompanyFund(null);
                    setDialogOpen(true);
                  }}
                >
                  إضافة صندوق شركة
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(companyFundsQuery.data ?? []).map((fund) => (
                  <GenericFundCard
                    key={fund.id}
                    fundId={fund.id}
                    name={fund.name}
                    subtitle="صندوق شركة"
                    currencies={(fund.currencies ?? []).map(c => ({
                      id: c.id,
                      currency: c.currency,
                      symbol: c.symbol,
                      balance: c.balance
                    }))}
                    createdAt={fund.created_at}
                    onClick={(id) => {
                      setSearchParams((prev) => {
                        prev.set('fundId', id.toString());
                        if (!prev.has('fundTab')) prev.set('fundTab', 'revenues');
                        return prev;
                      });
                    }}
                    onMoreCurrenciesClick={() => {
                      setSelectedCompanyFundForView(fund);
                      setCurrenciesDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        currentFund && (
          <GenericFundDetails
            fundId={currentFund.id}
            fundName={currentFund.name}
            fundCurrencies={(currentFund.currencies ?? []).map(c => ({
              id: c.id,
              currency: c.currency,
              symbol: c.symbol,
              balance: c.balance
            }))}
            modelType="App\\Models\\CompanyFundCurrency"
            sourceType="company_fund"
            fundIdField="company_fund_id"
            onBack={() => {
              setSearchParams((prev) => {
                prev.delete('fundId');
                return prev;
              });
            }}
            onEdit={() => {
              setSelectedCompanyFund(currentFund);
              setDialogOpen(true);
            }}
            onDelete={async () => {
              await handleDelete(currentFund);
            }}
            onAttachCurrency={() => {
              setSelectedCompanyFund(currentFund);
              setAttachDialogOpen(true);
            }}
            extraFixedValues={{
              company_fund_id: currentFund.id,
            }}
          />
        )
      )}

      <GenericFundDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fundType="company"
        defaultValues={selectedCompanyFund}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />

      <AttachCurrencyDialog
        open={attachDialogOpen}
        onOpenChange={(open) => {
          setAttachDialogOpen(open);
          if (!open) {
            setSelectedCompanyFundForCurrency(null);
            setSelectedCompanyFund(null);
          }
        }}
        currencies={(currenciesQuery.data?.data ?? []).filter(
          (c) =>
            !(selectedCompanyFundForCurrency || selectedCompanyFund)?.currencies?.some(
              (fc) => fc.currency === c.currency
            )
        )}
        onSubmit={handleAttachCurrency}
        loading={attachMutation.isPending}
      />

      <GenericFundCurrenciesDialog
        open={currenciesDialogOpen}
        onOpenChange={(open) => {
          setCurrenciesDialogOpen(open);
          if (!open) setSelectedCompanyFundForView(null);
        }}
        fund={selectedCompanyFundForView as any}
      />

      <GenericFundCurrencyDialog
        open={currencyEditDialogOpen}
        onOpenChange={(open) => {
          setCurrencyEditDialogOpen(open);
          if (!open) setSelectedCompanyFundCurrency(null);
        }}
        currency={selectedCompanyFundCurrency as any}
        onSubmit={async (payload) => {
          await updateCurrencyMutation.mutateAsync({ ...payload, balance: payload.balance.toString() });
          toast.success('تم تعديل العملة بنجاح');
        }}
        loading={updateCurrencyMutation.isPending}
      />
    </div>
  );
}
