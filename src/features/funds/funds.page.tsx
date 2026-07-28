import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { FundsTable } from './components/funds.table';
import { FundsDialog } from './components/funds.dialog';
import { AttachCurrencyDialog } from './components/attach-currency.dialog';
import { FundCurrenciesDialog } from './components/fund-currencies.dialog';
import { FundCurrencyDialog } from './components/fund-currency.dialog';
import { fundsApi } from './funds.api';
import type { CreateFundPayload, Fund, FundCurrency } from './types';
import { currenciesApi } from '@/features/currencies/currencies.api';
import type { Currency } from '@/features/currencies/types';
import { PageHeader } from '../components/page-header';
import type { UserRole } from '@/features/users/types';
import { usersApi } from '@/features/users/api/users.api';

type UserRecord = Awaited<ReturnType<typeof usersApi.getUserByRole>>;

const fundsQueryKeys = {
  all: ['funds'] as const,
};

const userRoles: UserRole[] = ['admin', 'client', 'investor', 'craftsman', 'employee', 'engineer', 'supplier', 'trustee'];

export function FundsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const userId = Number(params.userId || '');
  const userName = params.userName ? decodeURIComponent(params.userName) : '';
  const hasUserId = Number.isFinite(userId) && userId > 0;
  const roleParam = searchParams.get('tab');
  const userRole = userRoles.includes(roleParam as UserRole) ? (roleParam as UserRole) : null;
  const hasUserContext = hasUserId && !!userRole;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [currenciesDialogOpen, setCurrenciesDialogOpen] = useState(false);
  const [currencyEditDialogOpen, setCurrencyEditDialogOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [selectedFundForCurrency, setSelectedFundForCurrency] = useState<Fund | null>(null);
  const [selectedFundForView, setSelectedFundForView] = useState<Fund | null>(null);
  const [selectedCurrencyForEdit, setSelectedCurrencyForEdit] = useState<FundCurrency | null>(null);

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

  const currenciesQuery = useQuery<Currency[]>({
    queryKey: ['currencies'] as const,
    queryFn: () => currenciesApi.getAll(),
  });

  const resolvedUserId = userRecordQuery.data?.user.id ?? userId;
  const resolvedUserName = userRecordQuery.data?.user.name ?? userName;
  const visibleFunds = hasUserContext
    ? ((userRecordQuery.data?.user.funds as Fund[] | undefined) ?? [])
    : (fundsQuery.data ?? []);

  const saveFundMutation = useMutation({
    mutationFn: async (payload: CreateFundPayload) => {
      if (selectedFund) {
        return fundsApi.updateFund(selectedFund.id, { user_id: hasUserContext ? resolvedUserId : payload.user_id, name: payload.name });
      }
      return fundsApi.createFund({ user_id: hasUserContext ? resolvedUserId : payload.user_id, name: payload.name });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fundsQueryKeys.all });
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
      if (!selectedFundForCurrency) throw new Error('الصندوق غير محدد');
      return fundsApi.attachCurrency(selectedFundForCurrency.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fundsQueryKeys.all });
      if (hasUserContext && userRole) {
        await queryClient.invalidateQueries({ queryKey: ['funds', 'user-record', userRole, userId] });
      }
      await queryClient.invalidateQueries({ queryKey: ['currencies'] });
      setAttachDialogOpen(false);
      setSelectedFundForCurrency(null);
    },
  });

  const openCreateDialog = () => {
    setSelectedFund(null);
    setDialogOpen(true);
  };

  const openEditDialog = (fund: Fund) => {
    setSelectedFund(fund);
    setDialogOpen(true);
  };

  const openAttachCurrencyDialog = (fund: Fund) => {
    setSelectedFundForCurrency(fund);
    setAttachDialogOpen(true);
  };

  const openCurrenciesDialog = (fund: Fund) => {
    setSelectedFundForView(fund);
    setCurrenciesDialogOpen(true);
  };

  const openCurrencyEditDialog = (fund: Fund, currencyId: number) => {
    const currency = fund.currencies?.find((item) => item.id === currencyId) ?? null;
    setSelectedFundForView(fund);
    setSelectedCurrencyForEdit(currency);
    setCurrencyEditDialogOpen(true);
  };

  const handleSubmit = async (payload: CreateFundPayload) => {
    await saveFundMutation.mutateAsync(payload);
    toast.success(selectedFund ? 'تم تعديل الصندوق بنجاح' : 'تم إنشاء الصندوق بنجاح');
  };

  const handleDelete = async (fund: Fund) => {
    await deleteFundMutation.mutateAsync(fund);
    toast.success('تم حذف الصندوق بنجاح');
  };

  const handleAttachCurrency = async (payload: { currency_id: number; balance: string }) => {
    await attachCurrencyMutation.mutateAsync(payload);
    toast.success('تم حفظ العملة بالصندوق بنجاح');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        badge="المالية"
        title={hasUserContext ? `صناديق ${resolvedUserName || 'المستخدم'}` : 'الصناديق'}
        action={
          <div className="flex gap-3">
            {!hasUserContext ? (
              <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                العودة إلى المستخدمين
              </Button>
            ) : null}
            <Button onClick={openCreateDialog} disabled={!hasUserId}>
              إضافة صندوق جديد
            </Button>
          </div>
        }
      />

      <FundsTable
        data={visibleFunds}
        loading={hasUserContext ? userRecordQuery.isLoading : fundsQuery.isLoading}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        onAttachCurrency={openAttachCurrencyDialog}
        onCurrencyClick={openCurrencyEditDialog}
        onMoreCurrenciesClick={openCurrenciesDialog}
      />

      <FundsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fund={selectedFund}
        userId={hasUserContext ? resolvedUserId : undefined}
        onSubmit={handleSubmit}
        loading={saveFundMutation.isPending}
      />

      <AttachCurrencyDialog
        open={attachDialogOpen}
        onOpenChange={(open) => {
          setAttachDialogOpen(open);
          if (!open) setSelectedFundForCurrency(null);
        }}
        currencies={currenciesQuery.data ?? []}
        onSubmit={handleAttachCurrency}
        loading={attachCurrencyMutation.isPending}
      />

      <FundCurrenciesDialog
        open={currenciesDialogOpen}
        onOpenChange={(open) => {
          setCurrenciesDialogOpen(open);
          if (!open) setSelectedFundForView(null);
        }}
        fund={selectedFundForView}
        onCurrencyClick={openCurrencyEditDialog}
      />

      <FundCurrencyDialog
        open={currencyEditDialogOpen}
        onOpenChange={(open) => {
          setCurrencyEditDialogOpen(open);
          if (!open) setSelectedCurrencyForEdit(null);
        }}
        currency={selectedCurrencyForEdit}
        onSubmit={handleAttachCurrency}
        loading={attachCurrencyMutation.isPending}
      />
    </div>
  );
}

