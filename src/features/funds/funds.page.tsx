import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { PageHeader } from '../components/page-header';

import { fundsApi } from './funds.api';
import type { CreateFundPayload, Fund } from './types';
import { currenciesApi } from '@/features/currencies/currencies.api';
import type { UserRole } from '@/features/users/types';
import { usersApi } from '@/features/users/api/users.api';

import { GenericFundDetails } from '@/features/funds-shared/components/generic-fund-details';
import { GenericFundCard } from '@/features/funds-shared/components/generic-fund.card';
import { GenericFundDialog } from '@/features/funds-shared/components/generic-fund.dialog';
import { AttachCurrencyDialog } from '@/features/funds-shared/components/attach-currency.dialog';
import { GenericFundCurrenciesDialog } from '@/features/funds-shared/components/generic-fund-currencies.dialog';

type UserRecord = Awaited<ReturnType<typeof usersApi.getUserByRole>>;

const fundsQueryKeys = { all: ['funds'] as const };

const userRoles: UserRole[] = ['admin', 'client', 'investor', 'craftsman', 'employee', 'engineer', 'supplier', 'trustee'];

export function FundsPage({ isTab = false }: { isTab?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = Number(params.userId || params.id || '');
  const hasUserId = Number.isFinite(userId) && userId > 0;
  const rawRoleParam = params.role || searchParams.get('role') || searchParams.get('tab');
  const userRole = userRoles.includes(rawRoleParam as UserRole) ? (rawRoleParam as UserRole) : null;
  const hasUserContext = hasUserId && !!userRole;

  const selectedFundId = searchParams.get('fundId') ? Number(searchParams.get('fundId')) : null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [currenciesDialogOpen, setCurrenciesDialogOpen] = useState(false);

  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [selectedFundForView, setSelectedFundForView] = useState<Fund | null>(null);

  const userRecordQuery = useQuery<UserRecord | null>({
    queryKey: ['funds', 'user-record', userRole ?? 'all', userId] as const,
    queryFn: async () => {
      if (!hasUserContext || !userRole) {
        return null;
      }
      return usersApi.getUserByRole(userRole, userId);
    },
    enabled: hasUserContext && Boolean(userRole),
  });

  const fundsQuery = useQuery<Fund[]>({
    queryKey: fundsQueryKeys.all,
    queryFn: () => fundsApi.getFunds(),
    enabled: !hasUserContext,
  });

  const currenciesQuery = useQuery({
    queryKey: ['currencies'] as const,
    queryFn: () => currenciesApi.getAll(),
    enabled: attachDialogOpen,
  });

  const resolvedUserId = userRecordQuery.data?.user.id ?? userId;
  const visibleFunds = hasUserContext
    ? ((userRecordQuery.data?.user.funds as Fund[] | undefined) ?? [])
    : (fundsQuery.data ?? []);

  const fundDetailsQuery = useQuery({
    queryKey: ['funds', 'detail', selectedFundId],
    queryFn: () => fundsApi.getFundById(selectedFundId!),
    enabled: !!selectedFundId,
  });

  const effectiveFundId = selectedFundId;
  const currentFund = fundDetailsQuery.data || visibleFunds.find((f) => f.id === effectiveFundId) || null;

  const saveFundMutation = useMutation({
    mutationFn: async (payload: { name: string; user_id?: number }) => {
      const apiPayload: CreateFundPayload = {
        name: payload.name,
        user_id: hasUserContext ? resolvedUserId : payload.user_id || resolvedUserId || 0,
      };

      if (selectedFund) {
        return fundsApi.updateFund(selectedFund.id, apiPayload);
      }
      return fundsApi.createFund(apiPayload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fundsQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['fund-details'] });
      if (hasUserContext && userRole) {
        await queryClient.invalidateQueries({ queryKey: ['funds', 'user-record', userRole, userId] });
      }
      setDialogOpen(false);
      setSelectedFund(null);
    },
  });

  const deleteFundMutation = useMutation({
    mutationFn: (fund: Fund) => fundsApi.deleteFund(fund.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fundsQueryKeys.all });
      if (hasUserContext && userRole) {
        await queryClient.invalidateQueries({ queryKey: ['funds', 'user-record', userRole, userId] });
      }
    },
  });

  const attachCurrencyMutation = useMutation({
    mutationFn: async (payload: { currency_id: number; balance: string }) => {
      const fundToUpdate = selectedFund || currentFund;
      if (!fundToUpdate) throw new Error('الصندوق غير محدد');
      return fundsApi.attachCurrency(fundToUpdate.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fundsQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['fund-details'] });
      if (hasUserContext && userRole) {
        await queryClient.invalidateQueries({ queryKey: ['funds', 'user-record', userRole, userId] });
      }
      await queryClient.invalidateQueries({ queryKey: ['currencies'] });
      setAttachDialogOpen(false);
      setSelectedFund(null);
    },
  });

  return (
    <div className={cn("min-w-0 space-y-5", isTab && "space-y-0")}>
      {!effectiveFundId ? (
        <>
          {!isTab && (
            <PageHeader
              badge="المالية"
              title="الصناديق"
              icon={Wallet}
              className="border-0 shadow-none"
              action={
                <div className="flex gap-3" >
                  {!hasUserContext ? (
                    <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                      العودة إلى المستخدمين
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedFund(null);
                        setDialogOpen(true);
                      }}
                      disabled={!hasUserId}
                    >
                      إضافة صندوق جديد
                    </Button>
                  )}
                </div>
              }
            />
          )}

          {(hasUserContext ? userRecordQuery.isLoading : fundsQuery.isLoading) ? (
            <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[200px] rounded-lg border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : visibleFunds.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
              <Wallet className="mb-4 size-10 text-muted-foreground" />
              <h4 className="text-sm font-medium text-foreground">لا توجد صناديق</h4>
              <p className="mt-1 mb-4 max-w-sm text-sm text-muted-foreground">
                لم يتم إضافة أي صناديق لهذا المستخدم بعد.
              </p>
              {hasUserContext && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasUserId}
                  onClick={() => {
                    setSelectedFund(null);
                    setDialogOpen(true);
                  }}
                >
                  إضافة صندوق جديد
                </Button>
              )}
            </div>
          ) : (
            <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleFunds.map((fund) => (
                <GenericFundCard
                  key={fund.id}
                  fundId={fund.id}
                  name={fund.name}
                  subtitle={hasUserContext ? undefined : (fund.user?.name ?? 'بدون مستخدم')}
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
                    setSelectedFundForView(fund);
                    setCurrenciesDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
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
            modelType="App\\Models\\CurrencyFund"
            sourceType="user_fund"
            fundIdField="user_fund_id"
            onBack={() => {
              setSearchParams((prev) => {
                prev.delete('fundId');
                return prev;
              });
            }}
            onEdit={() => {
              setSelectedFund(currentFund);
              setDialogOpen(true);
            }}
            onDelete={async () => {
              setSearchParams((prev) => {
                prev.delete('fundId');
                return prev;
              });
              await deleteFundMutation.mutateAsync(currentFund);
            }}
            onAttachCurrency={() => {
              setSelectedFund(currentFund);
              setAttachDialogOpen(true);
            }}
            extraFixedValues={{
              user_id: resolvedUserId,
              user_fund_id: currentFund.id,
              fund_user_role: userRole ?? undefined,
            }}
          />
        )
      )}

      <GenericFundDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fundType="user"
        defaultValues={{
          id: selectedFund?.id,
          name: selectedFund?.name ?? '',
          user_id: selectedFund?.user?.id ?? resolvedUserId,
        }}
        onSubmit={async (values) => { await saveFundMutation.mutateAsync(values); }}
        loading={saveFundMutation.isPending}
        hideUserSelection={hasUserContext}
      />

      <AttachCurrencyDialog
        open={attachDialogOpen}
        title="إضافة عملة لصندوق المستخدم"
        currenciesLoading={currenciesQuery.isLoading}
        onOpenChange={(open) => {
          setAttachDialogOpen(open);
          if (!open) {
            setSelectedFund(null);
          }
        }}
        currencies={(currenciesQuery.data?.data ?? []).filter(
          (c) =>
            !(selectedFund || currentFund)?.currencies?.some(
              (fc) => fc.currency === c.currency
            )
        )}
        onSubmit={async (payload) => { await attachCurrencyMutation.mutateAsync({ ...payload, balance: payload.balance.toString() }); }}
        loading={attachCurrencyMutation.isPending}
      />

      <GenericFundCurrenciesDialog
        open={currenciesDialogOpen}
        onOpenChange={(open) => {
          setCurrenciesDialogOpen(open);
          if (!open) setSelectedFundForView(null);
        }}
        fund={selectedFundForView as any}
      />
    </div>
  );
}
