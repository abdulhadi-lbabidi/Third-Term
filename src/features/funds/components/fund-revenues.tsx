import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { useRevenues, useCreateRevenue, useUpdateRevenue, useDeleteRevenue } from '@/features/revenues/revenues.hooks';
import { RevenuesTable } from '@/features/revenues/components/revenues.table';
import { RevenuesDialog } from '@/features/revenues/components/revenues.dialog';
import type { Revenue } from '@/features/revenues/types';
import type { Fund } from '../types';

type FundRevenuesProps = {
  fund: Fund | null;
};

export function FundRevenues({ fund }: FundRevenuesProps) {
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);

  const { data: allRevenues = [], isLoading: isLoadingRevenues } = useRevenues();
  const createRevenueMutation = useCreateRevenue();
  const updateRevenueMutation = useUpdateRevenue();
  const deleteRevenueMutation = useDeleteRevenue();

  const fundRevenues = allRevenues.filter((r) => {
    if (r.revenueable_type !== 'App\\Models\\CurrencyFund') return false;
    
    // The revenueable_id points to the CurrencyFund (pivot) ID, not the Fund ID.
    // Check if the revenueable_info contains the fund_id.
    const info = r.revenueable_info as any;
    if (info?.details?.fund_id === fund?.id) return true;

    // Fallback: Check if the revenueable_id matches any of the fund's currencies IDs
    if (fund?.currencies) {
      return fund.currencies.some((c) => c.id === r.revenueable_id);
    }

    return false;
  });

  const handleRevenueSubmit = async (data: any) => {
    if (selectedRevenue) {
      await updateRevenueMutation.mutateAsync({ id: selectedRevenue.id, payload: data });
    } else {
      await createRevenueMutation.mutateAsync(data);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">جدول الإيرادات</h4>
        <Button
          size="sm"
          onClick={() => {
            setSelectedRevenue(null);
            setRevenueDialogOpen(true);
          }}
        >
          إضافة إيراد جديد
        </Button>
      </div>

      {isLoadingRevenues ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[150px] rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : fundRevenues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <TrendingUp className="mb-4 size-10 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">لا توجد إيرادات</h4>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            لم يتم إضافة أي إيرادات لهذا الصندوق بعد.
          </p>
        </div>
      ) : (
        <RevenuesTable
          data={fundRevenues}
          onEdit={(revenue) => {
            setSelectedRevenue(revenue);
            setRevenueDialogOpen(true);
          }}
          onDelete={async (revenue) => {
            await deleteRevenueMutation.mutateAsync(revenue.id);
          }}
        />
      )}

      <RevenuesDialog
        open={revenueDialogOpen}
        onOpenChange={setRevenueDialogOpen}
        defaultValues={selectedRevenue}
        fixedValues={
          fund
            ? {
              source: 'user_fund',
              user_id: fund.user?.id,
              user_fund_id: fund.id,
            }
            : undefined
        }
        onSubmit={handleRevenueSubmit}
        loading={createRevenueMutation.isPending || updateRevenueMutation.isPending}
      />
    </div>
  );
}
