import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { FundsTable } from './components/funds.table';
import { FundsDialog } from './components/funds.dialog';
import { AttachCurrencyDialog } from './components/attach-currency.dialog';
import { fundsApi } from './funds.api';
import type { CreateFundPayload, Fund } from './types';
import { currenciesApi } from '@/features/currencies/currencies.api';
import type { Currency } from '@/features/currencies/types';

const fundsQueryKeys = {
  all: ['funds'] as const,
  byUser: (userId?: number) => ['funds', userId ?? 'all'] as const,
};

export function FundsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams();
  const userId = Number(params.userId || '');
  const userName = params.userName ? decodeURIComponent(params.userName) : '';
  const hasUserId = Number.isFinite(userId) && userId > 0;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [selectedFundForCurrency, setSelectedFundForCurrency] = useState<Fund | null>(null);

  const fundsQuery = useQuery<Fund[]>({
    queryKey: fundsQueryKeys.byUser(hasUserId ? userId : undefined),
    queryFn: () => fundsApi.getFunds(),
  });

  const currenciesQuery = useQuery<Currency[]>({
    queryKey: ['currencies'] as const,
    queryFn: () => currenciesApi.getCurrencies(),
  });

  const visibleFunds = useMemo(() => {
    const funds = fundsQuery.data ?? [];
    if (!hasUserId) return funds;
    return funds.filter((fund) => fund.user?.id === userId);
  }, [fundsQuery.data, hasUserId, userId]);

  const saveFundMutation = useMutation({
    mutationFn: async (payload: CreateFundPayload) => {
      if (selectedFund) {
        return fundsApi.updateFund(selectedFund.id, { user_id: hasUserId ? userId : payload.user_id, name: payload.name });
      }
      return fundsApi.createFund({ user_id: hasUserId ? userId : payload.user_id, name: payload.name });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fundsQueryKeys.all });
      setDialogOpen(false);
      setSelectedFund(null);
    },
  });

  const deleteFundMutation = useMutation({
    mutationFn: (fund: Fund) => fundsApi.deleteFund(fund.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fundsQueryKeys.all });
    },
  });

  const attachCurrencyMutation = useMutation({
    mutationFn: async (payload: { currency_id: number; balance: string }) => {
      if (!selectedFundForCurrency) throw new Error('الصندوق غير محدد');
      return fundsApi.attachCurrency(selectedFundForCurrency.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: fundsQueryKeys.all });
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
      <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">المالية</div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {hasUserId ? `صناديق ${userName || 'المستخدم'}` : 'الصناديق'}
            </h1>
          
          </div>
          <div className="flex gap-3">
            {!hasUserId ? (
              <Button type="button" variant="outline" onClick={() => navigate('/users')} className="h-11 rounded-2xl border-slate-200 px-5 text-sm font-semibold">
                العودة إلى المستخدمين
              </Button>
            ) : null}
            <Button onClick={openCreateDialog} disabled={!hasUserId} className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800">
              إضافة صندوق جديد
            </Button>
          </div>
        </div>
      </div>

      <FundsTable
        data={visibleFunds}
        loading={fundsQuery.isLoading}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        onAttachCurrency={openAttachCurrencyDialog}
      />

      <FundsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fund={selectedFund}
        userId={hasUserId ? userId : undefined}
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
    </div>
  );
}
