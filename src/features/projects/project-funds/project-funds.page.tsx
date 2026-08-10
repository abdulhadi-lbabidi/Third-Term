import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FolderKanban, Wallet } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { PageHeader } from '../../components/page-header';

import { currenciesApi } from '@/features/currencies/currencies.api';
import { projectFundsApi } from './project-funds.api';
import type { CreateProjectFundPayload, ProjectFund, ProjectFundCurrency } from './project-funds.types';
import type { Project } from '../types';

import { GenericFundDetails } from '@/features/funds-shared/components/generic-fund-details';
import { GenericFundCard } from '@/features/funds-shared/components/generic-fund.card';
import { GenericFundDialog } from '@/features/funds-shared/components/generic-fund.dialog';
import { AttachCurrencyDialog } from '@/features/funds-shared/components/attach-currency.dialog';
import { GenericFundCurrenciesDialog } from '@/features/funds-shared/components/generic-fund-currencies.dialog';
import { GenericFundCurrencyDialog } from '@/features/funds-shared/components/generic-fund-currency.dialog';
import { SimplePagination } from '@/components/ui/pagination';
import { FundsListToolbar, type FundSortOption } from '@/features/funds-shared/components/funds-list-toolbar';
import { useDebouncedValue } from '@/features/funds-shared/use-debounced-value';

const PROJECT_SORT_OPTIONS: FundSortOption[] = [
  { value: '-created_at', label: 'الأحدث أولًا' },
  { value: 'created_at', label: 'الأقدم أولًا' },
  { value: 'name', label: 'اسم الصندوق أ–ي' },
  { value: '-name', label: 'اسم الصندوق ي–أ' },
  { value: 'project_name', label: 'اسم المشروع أ–ي' },
  { value: '-project_name', label: 'اسم المشروع ي–أ' },
];

const projectFundsQueryKeys = {
  all: ['project-funds'] as const,
  lists: () => [...projectFundsQueryKeys.all, 'list'] as const,
  list: (projectId?: number) => [...projectFundsQueryKeys.lists(), projectId] as const,
  details: () => [...projectFundsQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectFundsQueryKeys.details(), id] as const,
};

export function ProjectFundsPage({ isTab = false, projectData }: { isTab?: boolean; projectData?: Project | null }) {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFundId = searchParams.get('fundId') ? Number(searchParams.get('fundId')) : null;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.max(1, Number(searchParams.get('perPage')) || 20);
  const sort = searchParams.get('sort') || PROJECT_SORT_OPTIONS[0].value;
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebouncedValue(search.trim());

  const queryClient = useQueryClient();
  const projectId = Number(params.projectId || '');
  const hasProjectId = Number.isFinite(projectId) && projectId > 0;
  const hasEmbeddedProjectData = projectData !== undefined;


  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [currenciesDialogOpen, setCurrenciesDialogOpen] = useState(false);
  const [currencyEditDialogOpen, setCurrencyEditDialogOpen] = useState(false);

  const [selectedProjectFund, setSelectedProjectFund] = useState<ProjectFund | null>(null);
  const [selectedProjectFundForView, setSelectedProjectFundForView] = useState<ProjectFund | null>(null);
  const [selectedProjectFundCurrency, setSelectedProjectFundCurrency] = useState<ProjectFundCurrency | null>(null);

  useEffect(() => {
    setSearchParams((previous) => {
      if ((previous.get('q') || '') === debouncedSearch) return previous;
      if (debouncedSearch) previous.set('q', debouncedSearch);
      else previous.delete('q');
      previous.set('page', '1');
      return previous;
    }, { replace: true });
  }, [debouncedSearch, setSearchParams]);

  const projectFundsQuery = useQuery({
    queryKey: [...projectFundsQueryKeys.list(hasProjectId ? projectId : undefined), { page, perPage, search: debouncedSearch, sort }],
    queryFn: () => projectFundsApi.getProjectFunds({ projectId: hasProjectId ? projectId : undefined, page, perPage: hasProjectId ? 1000 : perPage, search: debouncedSearch, sort }),
    enabled: !hasEmbeddedProjectData,
    placeholderData: keepPreviousData,
  });

  const currenciesQuery = useQuery({
    queryKey: ['currencies'] as const,
    queryFn: () => currenciesApi.getAll(),
    enabled: attachDialogOpen,
  });

  const fundDetailsQuery = useQuery({
    queryKey: projectFundsQueryKeys.detail(selectedFundId!),
    queryFn: () => projectFundsApi.getProjectFundById(selectedFundId!),
    enabled: !!selectedFundId && !hasEmbeddedProjectData,
  });

  const embeddedFunds: ProjectFund[] = (projectData?.funds ?? [])
    .map((fund) => ({
      ...fund,
      project: {
        id: projectData!.id,
        name: projectData!.name,
        expected_cost: projectData!.expected_cost,
        status: projectData!.status,
        created_at: projectData!.created_at,
      },
    }))
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
  const availableFunds = hasEmbeddedProjectData ? embeddedFunds : (projectFundsQuery.data?.data ?? []);
  const projectFundsMeta = projectFundsQuery.data?.meta;
  const currentFund = fundDetailsQuery.data || availableFunds.find((f) => f.id === selectedFundId) || null;

  const visibleProjectFunds = hasProjectId
    ? availableFunds.filter((fund) => fund.project?.id === projectId)
    : availableFunds;

  const saveMutation = useMutation({
    mutationFn: async (payload: { name: string; project_id?: number }) => {
      const apiPayload: CreateProjectFundPayload = {
        name: payload.name,
        project_id: payload.project_id || projectId || 0,
      };

      if (selectedProjectFund) {
        return projectFundsApi.updateProjectFund(selectedProjectFund.id, { name: apiPayload.name });
      }
      return projectFundsApi.createProjectFund(apiPayload);
    },
    onSuccess: async (_fund, variables) => {
      const affectedProjectId = variables.project_id || projectData?.id || projectId;
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['fund-details'] });
      if (Number.isFinite(affectedProjectId) && affectedProjectId > 0) {
        await queryClient.invalidateQueries({
          queryKey: ['projects', affectedProjectId],
          exact: true,
          refetchType: 'all',
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['projects'], exact: true });
      setDialogOpen(false);
      setSelectedProjectFund(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حفظ الصندوق');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fund: ProjectFund) => projectFundsApi.deleteProjectFund(fund.id),
    onSuccess: async (_data, deletedFund) => {
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['projects'], exact: true, refetchType: 'all' });
      const deletedProjectId = deletedFund.project?.id || projectData?.id || projectId;
      if (Number.isFinite(deletedProjectId) && deletedProjectId > 0) {
        await queryClient.invalidateQueries({ queryKey: ['projects', deletedProjectId], exact: true, refetchType: 'all' });
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حذف الصندوق');
    },
  });

  const attachMutation = useMutation({
    mutationFn: async (payload: { currency_id: number; balance: number }) => {
      const fund = selectedProjectFund || currentFund;
      if (!fund) throw new Error('لم يتم تحديد صندوق');
      return projectFundsApi.attachCurrency(fund.id, {
        currency_id: payload.currency_id,
        balance: String(payload.balance),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['fund-details'] });
      const affectedProjectId = projectData?.id || selectedProjectFund?.project?.id || projectId;
      if (Number.isFinite(affectedProjectId) && affectedProjectId > 0) {
        await queryClient.invalidateQueries({
          queryKey: ['projects', affectedProjectId],
          exact: true,
          refetchType: 'all',
        });
      }
      setAttachDialogOpen(false);
      setSelectedProjectFund(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء إرفاق العملة');
    },
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: async (payload: { currency_id: number; balance: string }) => {
      const fund = selectedProjectFund || currentFund;
      if (!fund) throw new Error('صندوق المشروع غير محدد');
      return projectFundsApi.attachCurrency(fund.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['fund-details'] });
      setCurrencyEditDialogOpen(false);
      setSelectedProjectFundCurrency(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء تعديل العملة');
    },
  });

  const currentProject = projectData ?? availableFunds.find((fund) => fund.project?.id === projectId)?.project ?? null;

  return (
    <div className={cn("space-y-5", isTab && "space-y-0")}>
      {!selectedFundId ? (
        <>
          {!isTab && (
            <PageHeader
              badge="المالية"
              title={currentProject ? `صناديق المشروع: ${currentProject.name}` : 'صناديق المشاريع'}
              icon={Wallet}
              className='border-0 shadow-none'
              action={
                <Button
                  onClick={() => {
                    setSelectedProjectFund(null);
                    setDialogOpen(true);
                  }}
                >
                  إضافة صندوق مشروع
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
                  setSelectedProjectFund(null);
                  setDialogOpen(true);
                }}
              >
                إضافة صندوق مشروع
              </Button>
            </div>
          )}

          {isTab ? (
            <FundsListToolbar
              title="صناديق المشاريع"
              icon={<FolderKanban className="size-5" />}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="البحث باسم الصندوق أو المشروع..."
              sort={sort}
              onSortChange={(value) => setSearchParams((previous) => { previous.set('sort', value); previous.set('page', '1'); return previous; })}
              sortOptions={PROJECT_SORT_OPTIONS}
              onReset={() => { setSearch(''); setSearchParams((previous) => { previous.delete('q'); previous.delete('sort'); previous.set('page', '1'); return previous; }); }}
              onCreate={() => { setSelectedProjectFund(null); setDialogOpen(true); }}
              createLabel="إضافة صندوق"
              total={projectFundsMeta?.total}
            />
          ) : null}

          {!hasEmbeddedProjectData && projectFundsQuery.isLoading ? (
            <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[200px] rounded-lg border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : visibleProjectFunds.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full rounded-lg border border-dashed border-border py-16 text-center">
              <Wallet className="mb-4 size-10 text-muted-foreground" />
              <h4 className="text-sm font-medium text-foreground">لا توجد صناديق</h4>
              <p className="mt-1 mb-4 max-w-sm text-sm text-muted-foreground">
                {currentProject ? `لم يتم إضافة أي صناديق لمشروع ${currentProject.name} بعد.` : 'لم يتم إضافة أي صناديق بعد.'}
              </p>
            </div>
          ) : (
            <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProjectFunds.map((fund) => (
                <GenericFundCard
                  key={fund.id}
                  fundId={fund.id}
                  name={fund.name}
                  subtitle={fund.project?.name ?? 'بدون مشروع'}
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
                    setSelectedProjectFundForView(fund);
                    setCurrenciesDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
          {isTab && projectFundsMeta ? (
            <SimplePagination
              currentPage={projectFundsMeta.current_page ?? page}
              totalPages={projectFundsMeta.last_page ?? 1}
              onPageChange={(value) => setSearchParams((previous) => { previous.set('page', String(value)); return previous; })}
              meta={projectFundsMeta}
              limit={perPage}
              limitOptions={[5, 10, 20, 50]}
              onLimitChange={(value) => setSearchParams((previous) => { previous.set('perPage', String(value)); previous.set('page', '1'); return previous; })}
            />
          ) : null}
        </>
      ) : (
        !hasEmbeddedProjectData && projectFundsQuery.isLoading ? (
          <div className="space-y-5 shadow-md rounded-xl p-5 bg-white">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-md border border-border bg-slate-100 animate-pulse shrink-0" />
              <div className="space-y-3 flex-1">
                <div className="h-6 w-1/3 rounded bg-slate-100 animate-pulse" />
                <div className="h-4 w-1/4 rounded bg-slate-100 animate-pulse" />
                <div className="flex gap-2 pt-2">
                  <div className="h-8 w-24 rounded-md bg-slate-100 animate-pulse" />
                  <div className="h-8 w-24 rounded-md bg-slate-100 animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="h-9 w-28 rounded-md bg-slate-100 animate-pulse" />
                <div className="h-9 w-24 rounded-md bg-slate-100 animate-pulse" />
                <div className="h-9 w-24 rounded-md bg-slate-100 animate-pulse" />
              </div>
            </div>

            <div className="flex gap-2 border-b border-border pb-2 mt-6">
              <div className="h-9 w-28 rounded-md bg-slate-100 animate-pulse" />
              <div className="h-9 w-28 rounded-md bg-slate-100 animate-pulse" />
              <div className="h-9 w-28 rounded-md bg-slate-100 animate-pulse" />
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <div className="h-5 w-32 rounded bg-slate-100 animate-pulse" />
                <div className="h-9 w-32 rounded-md bg-slate-100 animate-pulse" />
              </div>
              <div className="h-[300px] w-full rounded-xl border border-border bg-slate-50/50 animate-pulse" />
            </div>
          </div>
        ) : currentFund && (
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
            modelType="App\\Models\\ProjectFundCurrency"
            sourceType="project_fund"
            fundIdField="project_fund_id"
            onBack={() => {
              setSearchParams((prev) => {
                prev.delete('fundId');
                return prev;
              });
            }}
            onEdit={() => {
              setSelectedProjectFund(currentFund);
              setDialogOpen(true);
            }}
            onDelete={async () => {
              setSearchParams((prev) => {
                prev.delete('fundId');
                return prev;
              });
              await deleteMutation.mutateAsync(currentFund);
            }}
            onAttachCurrency={() => {
              setSelectedProjectFund(currentFund);
              setAttachDialogOpen(true);
            }}
            extraFixedValues={{
              project_id: currentFund.project?.id,
            }}
          />
        )
      )}

      <GenericFundDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fundType="project"
        defaultValues={{
          id: selectedProjectFund?.id,
          name: selectedProjectFund?.name ?? '',
          project_id: selectedProjectFund?.project?.id ?? projectId,
        }}
        onSubmit={async (values) => { await saveMutation.mutateAsync(values); }}
        loading={saveMutation.isPending}
        hideProjectSelection={!!projectId}
      />

      <AttachCurrencyDialog
        open={attachDialogOpen}
        title="إضافة عملة لصندوق المشروع"
        currenciesLoading={currenciesQuery.isLoading}
        onOpenChange={(open) => {
          setAttachDialogOpen(open);
          if (!open) {
            setSelectedProjectFund(null);
          }
        }}
        currencies={(currenciesQuery.data?.data ?? []).filter(
          (c) =>
            !(selectedProjectFund || currentFund)?.currencies?.some(
              (fc) => fc.currency === c.currency
            )
        )}
        onSubmit={async (payload) => { await attachMutation.mutateAsync(payload); }}
        loading={attachMutation.isPending}
      />

      <GenericFundCurrenciesDialog
        open={currenciesDialogOpen}
        onOpenChange={(open) => {
          setCurrenciesDialogOpen(open);
          if (!open) setSelectedProjectFundForView(null);
        }}
        fund={selectedProjectFundForView as any}
      />

      <GenericFundCurrencyDialog
        open={currencyEditDialogOpen}
        onOpenChange={(open) => {
          setCurrencyEditDialogOpen(open);
          if (!open) setSelectedProjectFundCurrency(null);
        }}
        currency={selectedProjectFundCurrency as any}
        onSubmit={async (payload) => { await updateCurrencyMutation.mutateAsync({ ...payload, balance: payload.balance.toString() }); }}
        loading={updateCurrencyMutation.isPending}
      />
    </div>
  );
}
