import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Building2, Wallet } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { currenciesApi } from '@/features/currencies/currencies.api';
import { companyFundsApi } from './company-funds.api';
import { GenericFundDetails } from '@/features/funds-shared/components/generic-fund-details';
import { GenericFundCard, GenericFundCardSkeleton } from '@/features/funds-shared/components/generic-fund.card';
import { GenericFundDialog } from '@/features/funds-shared/components/generic-fund.dialog';
import { DeleteConfirmDialog } from '@/shared/components/ui/delete-confirm-dialog';
import { AttachCurrencyDialog } from '@/features/funds-shared/components/attach-currency.dialog';
import { GenericFundCurrenciesDialog } from '@/features/funds-shared/components/generic-fund-currencies.dialog';
import { GenericFundCurrencyDialog } from '@/features/funds-shared/components/generic-fund-currency.dialog';
import type { CompanyFund, CompanyFundCurrency, CreateCompanyFundPayload } from './types';
import { PageHeader } from '../components/page-header';
import { cn } from '@/shared/lib/utils';
import { SimplePagination } from '@/components/ui/pagination';
import { FundsListToolbar, type FundSortOption } from '@/features/funds-shared/components/funds-list-toolbar';
import { useDebouncedValue } from '@/features/funds-shared/use-debounced-value';

const companyFundsQueryKeys = {
  all: ['company-funds'] as const,
  detail: (id: number) => [...companyFundsQueryKeys.all, id] as const,
};

const COMPANY_SORT_OPTIONS: FundSortOption[] = [
  { value: '-created_at', label: 'الأحدث أولًا' },
  { value: 'created_at', label: 'الأقدم أولًا' },
  { value: 'name', label: 'الاسم أ–ي' },
  { value: '-name', label: 'الاسم ي–أ' },
];

export function CompanyFundsPage({ isTab = false }: { isTab?: boolean }) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedFundId = searchParams.get('fundId') ? Number(searchParams.get('fundId')) : null;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.max(1, Number(searchParams.get('perPage')) || 20);
  const sort = searchParams.get('sort') || COMPANY_SORT_OPTIONS[0].value;
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebouncedValue(search.trim());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [currenciesDialogOpen, setCurrenciesDialogOpen] = useState(false);
  const [currencyEditDialogOpen, setCurrencyEditDialogOpen] = useState(false);

  const [selectedCompanyFund, setSelectedCompanyFund] = useState<CompanyFund | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fundToDelete, setFundToDelete] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundForCurrency, setSelectedCompanyFundForCurrency] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundForView, setSelectedCompanyFundForView] = useState<CompanyFund | null>(null);
  const [selectedCompanyFundCurrency, setSelectedCompanyFundCurrency] = useState<CompanyFundCurrency | null>(null);

  useEffect(() => {
    setSearchParams((previous) => {
      if ((previous.get('q') || '') === debouncedSearch) return previous;
      if (debouncedSearch) previous.set('q', debouncedSearch);
      else previous.delete('q');
      previous.set('page', '1');
      return previous;
    }, { replace: true });
  }, [debouncedSearch, setSearchParams]);

  const companyFundsQuery = useQuery({
    queryKey: [...companyFundsQueryKeys.all, { page, perPage, search: debouncedSearch, sort }],
    queryFn: () => companyFundsApi.getCompanyFunds({ page, perPage, search: debouncedSearch, sort }),
    placeholderData: keepPreviousData,
  });

  const currenciesQuery = useQuery({
    queryKey: ['currencies'] as const,
    queryFn: () => currenciesApi.getAll(),
    enabled: attachDialogOpen,
  });

  const fundDetailsQuery = useQuery({
    queryKey: companyFundsQueryKeys.detail(selectedFundId!),
    queryFn: () => companyFundsApi.getCompanyFundById(selectedFundId!),
    enabled: !!selectedFundId,
  });

  const companyFunds = companyFundsQuery.data?.data ?? [];
  const companyFundsMeta = companyFundsQuery.data?.meta;
  const currentFund = fundDetailsQuery.data || companyFunds.find((f) => f.id === selectedFundId) || null;

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateCompanyFundPayload) => {
      if (selectedCompanyFund) {
        return companyFundsApi.updateCompanyFund(selectedCompanyFund.id, payload);
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

  const handleSubmit = async (payload: CreateCompanyFundPayload) => {
    await saveMutation.mutateAsync(payload);
    toast.success(selectedCompanyFund ? 'تم تعديل صندوق الشركة بنجاح' : 'تم إنشاء صندوق الشركة بنجاح');
    if (payload.is_locked) {
      setSearchParams((prev) => {
        prev.delete('fundId');
        return prev;
      });
    }
  };

  const handleDelete = async (fund: CompanyFund) => {
    if (selectedFundId === fund.id) {
      setSearchParams((prev) => {
        prev.delete('fundId');
        return prev;
      });
    }
    await deleteMutation.mutateAsync(fund);
    toast.success('تم حذف صندوق الشركة بنجاح');
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
          {isTab && (
            <div className="hidden">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setSelectedCompanyFund(null);
                  setDialogOpen(true);
                }}
              >
                إضافة صندوق شركة
              </Button>
            </div>
          )}
          {isTab ? (
            <FundsListToolbar
              title="صناديق الشركة"
              icon={<Building2 className="size-5" />}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="البحث باسم صندوق الشركة..."
              sort={sort}
              onSortChange={(value) => setSearchParams((previous) => { previous.set('sort', value); previous.set('page', '1'); return previous; })}
              sortOptions={COMPANY_SORT_OPTIONS}
              onReset={() => { setSearch(''); setSearchParams((previous) => { previous.delete('q'); previous.delete('sort'); previous.set('page', '1'); return previous; }); }}
              onCreate={() => { setSelectedCompanyFund(null); setDialogOpen(true); }}
              createLabel="إضافة صندوق"
              total={companyFundsMeta?.total}
            />
          ) : null}
          <div className='flex bg-white '>
            {companyFundsQuery.isLoading ? (
              <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <GenericFundCardSkeleton key={i} />
                ))}
              </div>
            ) : companyFunds.length === 0 ? (
              <div className="flex flex-col items-center w-full justify-center rounded-lg border border-dashed border-border py-16 text-center">
                <Wallet className="mb-4 size-10 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">لا توجد صناديق</h4>
                <p className="mt-1 mb-4 max-w-sm text-sm text-muted-foreground">
                  لم يتم إضافة أي صناديق شركة بعد.
                </p>
              </div>
            ) : (
              <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {companyFunds.map((fund) => (
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
                    created_at={fund.created_at}
                    is_locked={fund.is_locked}
                    status={fund.status}
                    description={fund.description}
                    threshold={fund.threshold}
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
                    onEdit={() => {
                      setSelectedCompanyFund(fund);
                      setDialogOpen(true);
                    }}
                    onDelete={() => {
                      setFundToDelete(fund);
                      setDeleteConfirmOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          {isTab && companyFundsMeta ? (
            <SimplePagination
              currentPage={companyFundsMeta.current_page ?? page}
              totalPages={companyFundsMeta.last_page ?? 1}
              onPageChange={(value) => setSearchParams((previous) => { previous.set('page', String(value)); return previous; })}
              meta={companyFundsMeta}
              limit={perPage}
              limitOptions={[5, 10, 20, 50]}
              onLimitChange={(value) => setSearchParams((previous) => { previous.set('perPage', String(value)); previous.set('page', '1'); return previous; })}
            />
          ) : null}
        </>
      ) : (
        currentFund && (
          <GenericFundDetails
            fundId={currentFund.id}
            fundName={currentFund.name}
            fundCurrencies={(currentFund.currencies ?? []).map(c => ({
              id: c.id,
              expenseable_id: c.expenseable_id,
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
        title="إضافة عملة لصندوق الشركة"
        currenciesLoading={currenciesQuery.isLoading}
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

      <DeleteConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setFundToDelete(null);
        }}
        onConfirm={async () => {
          if (fundToDelete) {
            await handleDelete(fundToDelete);
            setDeleteConfirmOpen(false);
            setFundToDelete(null);
          }
        }}
        isDeleting={deleteMutation.isPending}
        title="تأكيد حذف صندوق الشركة"
        description={`هل أنت متأكد من حذف صندوق "${fundToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
      />
    </div>
  );
}
