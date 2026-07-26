import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { itemsApi } from './items.api';
import { ItemsDialog } from './components/items.dialog';
import { ItemsTable } from './components/items.table';
import type { CreateItemPayload, Item } from './types';
import { PageHeader } from '../components/page-header';

const itemsQueryKeys = {
  all: ['items'] as const,
};

export function ItemsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const itemsQuery = useQuery<Item[]>({
    queryKey: itemsQueryKeys.all,
    queryFn: () => itemsApi.getItems(),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateItemPayload) => {
      if (selectedItem) {
        return itemsApi.updateItem(selectedItem.id, payload);
      }
      return itemsApi.createItem(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: itemsQueryKeys.all });
      setDialogOpen(false);
      setSelectedItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (item: Item) => itemsApi.deleteItem(item.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: itemsQueryKeys.all });
    },
  });

  const handleSubmit = async (payload: CreateItemPayload) => {
    await saveMutation.mutateAsync(payload);
    toast.success(selectedItem ? 'تم تعديل البند بنجاح' : 'تم إنشاء البند بنجاح');
  };

  const handleDelete = async (item: Item) => {
    await deleteMutation.mutateAsync(item);
    toast.success('تم حذف البند بنجاح');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        badge="البنود"
        title="البنود"
        action={
          <Button
            onClick={() => {
              setSelectedItem(null);
              setDialogOpen(true);
            }}
            className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
          >
            إضافة بند جديد
          </Button>
        }
      />

      <ItemsTable
        data={itemsQuery.data ?? []}
        loading={itemsQuery.isLoading}
        onEdit={(item) => {
          setSelectedItem(item);
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
      />

      <ItemsDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedItem(null);
        }}
        item={selectedItem}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />
    </div>
  );
}
