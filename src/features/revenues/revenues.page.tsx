import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { RevenuesTable } from './components/revenues.table';
import { RevenuesDialog } from './components/revenues.dialog';
import { useRevenues, useCreateRevenue, useUpdateRevenue, useDeleteRevenue } from './revenues.hooks';
import type { Revenue, CreateRevenuePayload } from './types';
import { TrendingUp } from 'lucide-react';

export function RevenuesPage() {
  const { data: revenues = [], isLoading } = useRevenues();
  const createMutation = useCreateRevenue();
  const updateMutation = useUpdateRevenue();
  const deleteMutation = useDeleteRevenue();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);

  const handleAddClick = () => {
    setSelectedRevenue(null);
    setDialogOpen(true);
  };

  const handleEditClick = (revenue: Revenue) => {
    setSelectedRevenue(revenue);
    setDialogOpen(true);
  };

  const handleDelete = async (revenue: Revenue) => {
    await deleteMutation.mutateAsync(revenue.id);
  };

  const handleSubmit = async (data: CreateRevenuePayload) => {
    if (selectedRevenue) {
      await updateMutation.mutateAsync({ id: selectedRevenue.id, payload: data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        badge="الإيرادات"
        title="الإيرادات"
        icon={TrendingUp}
        action={
          <Button
            type="button"
            onClick={handleAddClick}
            className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
          >
            إضافة إيراد جديد
          </Button>
        }
      />

      <RevenuesTable
        data={revenues}
        loading={isLoading}
        onEdit={handleEditClick}
        onDelete={handleDelete}
      />

      <RevenuesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={selectedRevenue}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
