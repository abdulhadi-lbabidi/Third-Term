import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { RevenuesForm } from './components/revenues.form';
import { revenuesApi } from './revenues.api';
import type { CreateRevenuePayload, Revenue, RevenueSource } from './types';
import { TrendingUp } from 'lucide-react';

const revenuesQueryKeys = {
  all: ['revenues'] as const,
};

function getRevenueSource(revenue: Revenue): RevenueSource | undefined {
  const fromInfo =
    revenue.revenueable_info?.type === 'currency_fund' || revenue.revenueable_info?.type === 'user_fund'
      ? 'user_fund'
      : revenue.revenueable_info?.type === 'company_fund' || revenue.revenueable_info?.type === 'project_fund'
        ? (revenue.revenueable_info.type as RevenueSource)
        : undefined;

  if (fromInfo) {
    return fromInfo;
  }

  switch (revenue.revenueable_type) {
    case 'App\\Models\\CompanyFundCurrency':
      return 'company_fund';
    case 'App\\Models\\ProjectFundCurrency':
      return 'project_fund';
    case 'App\\Models\\CurrencyFund':
      return 'user_fund';
    default:
      return undefined;
  }
}

export function NewRevenuePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const revenueId = Number(searchParams.get('revenueId') || '');
  const hasRevenueId = Number.isFinite(revenueId) && revenueId > 0;

  const revenueQuery = useQuery<Revenue>({
    queryKey: ['revenues', revenueId] as const,
    queryFn: () => revenuesApi.getRevenue(revenueId),
    enabled: hasRevenueId,
  });
  const isEditMode = hasRevenueId;

  const defaultValues = useMemo<Revenue | null>(() => {
    const revenue = revenueQuery.data;
    if (!revenue) return null;

    const source = getRevenueSource(revenue);
    const details = revenue.revenueable_info?.details;
    const detailsRecord =
      details && typeof details === 'object' ? (details as Record<string, unknown>) : null;

    const projectFundDetails =
      detailsRecord && ('project_fund' in detailsRecord || 'project_fund_id' in detailsRecord)
        ? (detailsRecord as {
          project_fund_id?: number;
          project_fund?: { id?: number; project_id?: number; project?: { id?: number } };
          id?: number;
        })
        : null;

    const userFundDetails =
      detailsRecord && ('fund' in detailsRecord || 'fund_id' in detailsRecord)
        ? (detailsRecord as { id?: number; fund_id?: number })
        : null;

    const revenueableId =
      revenue.revenueable_id ??
      (source === 'user_fund' ? userFundDetails?.id : undefined) ??
      projectFundDetails?.id ??
      revenue.revenueable_info?.id;

    return {
      ...revenue,
      revenueable_type: revenue.revenueable_type,
      revenueable_id: revenueableId,
      revenueable_info: revenue.revenueable_info,
      ...(source === 'company_fund'
        ? {
          company_fund_id: revenue.revenueable_info?.company_fund_id ?? revenue.revenueable_info?.id,
        }
        : source === 'project_fund'
          ? {
            project_id:
              revenue.revenueable_info?.project_id ??
              projectFundDetails?.project_fund?.project_id ??
              projectFundDetails?.project_fund?.project?.id,
          }
          : {}),
    };
  }, [revenueQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateRevenuePayload) => {
      if (isEditMode) {
        return revenuesApi.updateRevenue(revenueId, payload);
      }
      return revenuesApi.createRevenue(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: revenuesQueryKeys.all });
      if (hasRevenueId) {
        await queryClient.invalidateQueries({ queryKey: ['revenues', revenueId] });
      }
      await queryClient.invalidateQueries({ queryKey: ['project-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['company-funds'] });
      await queryClient.invalidateQueries({ queryKey: ['funds'] });
      navigate('/revenues', { replace: true });
    },
  });

  const handleSubmit = async (payload: CreateRevenuePayload) => {
    await saveMutation.mutateAsync(payload);
    toast.success(isEditMode ? 'تم تعديل الإيراد بنجاح' : 'تم إضافة الإيراد بنجاح');
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <PageHeader
        badge="الإيرادات"
        title={isEditMode ? 'تعديل إيراد' : 'إضافة إيراد'}
        icon={TrendingUp}
        action={
          <Button type="button" variant="outline" onClick={() => navigate('/revenues')}>
            رجوع
          </Button>
        }
      />

      <div className="surface-panel p-5 sm:p-6">
        {isEditMode && revenueQuery.isLoading ? (
          <div className="animate-pulse space-y-5">
            <div className="grid gap-2 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-16 rounded-md bg-slate-200" />)}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-11 rounded-md bg-slate-200" />)}
            </div>
            <div className="h-24 rounded-md bg-slate-200" />
          </div>
        ) : (
          <RevenuesForm defaultValues={defaultValues} onSubmit={handleSubmit} loading={saveMutation.isPending} />
        )}
      </div>
    </div>
  );
}
