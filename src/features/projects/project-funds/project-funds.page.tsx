import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Wallet } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { PageHeader } from '../../components/page-header';

import { currenciesApi } from '@/features/currencies/currencies.api';
import { projectsApi } from '../projects.api';
import { projectFundsApi } from './project-funds.api';
import type { CreateProjectFundPayload, ProjectFund, ProjectFundCurrency } from './project-funds.types';

import { GenericFundDetails } from '@/features/funds-shared/components/generic-fund-details';
import { GenericFundCard } from '@/features/funds-shared/components/generic-fund.card';
import { GenericFundDialog } from '@/features/funds-shared/components/generic-fund.dialog';
import { AttachCurrencyDialog } from '@/features/funds-shared/components/attach-currency.dialog';
import { GenericFundCurrenciesDialog } from '@/features/funds-shared/components/generic-fund-currencies.dialog';
import { GenericFundCurrencyDialog } from '@/features/funds-shared/components/generic-fund-currency.dialog';
import { FolderKanban, CircleDollarSign, Activity } from 'lucide-react';

const projectFundsQueryKeys = {
  all: ['project-funds'] as const,
  lists: () => [...projectFundsQueryKeys.all, 'list'] as const,
  list: (projectId?: number) => [...projectFundsQueryKeys.lists(), projectId] as const,
  details: () => [...projectFundsQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectFundsQueryKeys.details(), id] as const,
};

export function ProjectFundsPage({ isTab = false }: { isTab?: boolean }) {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFundId = searchParams.get('fundId') ? Number(searchParams.get('fundId')) : null;

  const queryClient = useQueryClient();
  const projectId = Number(params.projectId || '');
  const hasProjectId = Number.isFinite(projectId) && projectId > 0;

  const statusLabels: Record<string, string> = {
    pending: 'قيد الانتظار',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  };


  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [currenciesDialogOpen, setCurrenciesDialogOpen] = useState(false);
  const [currencyEditDialogOpen, setCurrencyEditDialogOpen] = useState(false);

  const [selectedProjectFund, setSelectedProjectFund] = useState<ProjectFund | null>(null);
  const [selectedProjectFundForView, setSelectedProjectFundForView] = useState<ProjectFund | null>(null);
  const [selectedProjectFundCurrency, setSelectedProjectFundCurrency] = useState<ProjectFundCurrency | null>(null);

  const projectQuery = useQuery({
    queryKey: ['projects'] as const,
    queryFn: () => projectsApi.getProjects(),
  });

  const projectFundsQuery = useQuery<ProjectFund[]>({
    queryKey: projectFundsQueryKeys.list(hasProjectId ? projectId : undefined),
    queryFn: () => projectFundsApi.getProjectFunds(hasProjectId ? projectId : undefined),
  });

  const currenciesQuery = useQuery({
    queryKey: ['currencies'] as const,
    queryFn: () => currenciesApi.getAll(),
  });

  const fundDetailsQuery = useQuery({
    queryKey: projectFundsQueryKeys.detail(selectedFundId!),
    queryFn: () => projectFundsApi.getProjectFundById(selectedFundId!),
    enabled: !!selectedFundId,
  });

  const currentFund = fundDetailsQuery.data || projectFundsQuery.data?.find((f) => f.id === selectedFundId) || null;

  const visibleProjectFunds = hasProjectId
    ? (projectFundsQuery.data ?? []).filter((fund) => fund.project?.id === projectId)
    : (projectFundsQuery.data ?? []);

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['fund-details'] });
      setDialogOpen(false);
      setSelectedProjectFund(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حفظ الصندوق');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fund: ProjectFund) => projectFundsApi.deleteProjectFund(fund.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectFundsQueryKeys.all });
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

  const projectsList = Array.isArray(projectQuery.data) ? projectQuery.data : [];
  const currentProject = projectsList.find((item) => item.id === projectId) ?? null;

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

          {projectFundsQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[200px] rounded-lg border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : visibleProjectFunds.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
              <Wallet className="mb-4 size-10 text-muted-foreground" />
              <h4 className="text-sm font-medium text-foreground">لا توجد صناديق</h4>
              <p className="mt-1 mb-4 max-w-sm text-sm text-muted-foreground">
                {currentProject ? `لم يتم إضافة أي صناديق لمشروع ${currentProject.name} بعد.` : 'لم يتم إضافة أي صناديق بعد.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProjectFund(null);
                  setDialogOpen(true);
                }}
              >
                إضافة صندوق مشروع
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        </>
      ) : (
        projectFundsQuery.isLoading ? (
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
              await deleteMutation.mutateAsync(currentFund);
              setSearchParams((prev) => {
                prev.delete('fundId');
                return prev;
              });
            }}
            onAttachCurrency={() => {
              setSelectedProjectFund(currentFund);
              setAttachDialogOpen(true);
            }}
            extraFixedValues={{
              project_id: currentFund.project?.id,
            }}
            extraDetails={
              currentFund.project ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                    <div className="rounded-md bg-indigo-100/50 p-2 text-indigo-600">
                      <FolderKanban className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-muted-foreground">المشروع</span>
                      <span className="text-sm font-semibold text-foreground line-clamp-1" title={currentFund.project.name}>
                        {currentFund.project.name}
                      </span>
                    </div>
                  </div>

                  {currentFund.project.expected_cost !== undefined && (
                    <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                      <div className="rounded-md bg-emerald-100/50 p-2 text-emerald-600">
                        <CircleDollarSign className="size-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-muted-foreground">التكلفة المتوقعة</span>
                        <span className="text-sm font-semibold text-foreground finance-num">
                          {Number(currentFund.project.expected_cost).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {currentFund.project.status && (
                    <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                      <div className="rounded-md bg-blue-100/50 p-2 text-blue-600">
                        <Activity className="size-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-muted-foreground">الحالة</span>
                        <span className="text-sm font-semibold capitalize text-foreground">
                          {statusLabels[currentFund.project.status] || currentFund.project.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null
            }
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
