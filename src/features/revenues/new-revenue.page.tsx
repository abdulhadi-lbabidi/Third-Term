import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
    // Note: The success toast is handled in the revenuesApi or here depending on how it's set up. We'll use sonner toast just in case.
    // wait, revenuesApi already sets x-success-message so the interceptor might show it, but in hooks toast is also used.
    // We will leave toast for simplicity, but in revenues hook it's done in onSuccess. In new-revenue.page, we call API directly.
    // wait, I can just use the hook if I want, but I used useMutation with API directly.
  };

  return (
    <div className="space-y-5">
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
        <RevenuesForm defaultValues={defaultValues} onSubmit={handleSubmit} loading={saveMutation.isPending} />
      </div>
    </div>
  );
}
