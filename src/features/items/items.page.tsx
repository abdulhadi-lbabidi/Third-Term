import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { itemsApi, type ItemResponse } from './items.api';
import { ItemsDialog } from './components/items.dialog';
import { ItemsTable } from './components/items.table';
import { MaterialsDialog } from './components/materials.dialog';
import type { CreateItemPayload, Item } from './types';
import { PageHeader } from '../components/page-header';
import { ListChecks } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

export function ItemsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 50;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [materialsDialogOpen, setMaterialsDialogOpen] = useState(false);
  const [materialsItem, setMaterialsItem] = useState<Item | null>(null);

  const itemsQuery = useQuery<ItemResponse>({
    queryKey: ['items', page, perPage],
    queryFn: () => itemsApi.getItems(page, perPage),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateItemPayload) => {
      if (selectedItem) {
        return itemsApi.updateItem(selectedItem.id, payload);
      }
      return itemsApi.createItem(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['items'] });
      setDialogOpen(false);
      setSelectedItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (item: Item) => itemsApi.deleteItem(item.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['items'] });
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

  const items = itemsQuery.data?.data ?? [];
  const meta = itemsQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="البنود"
        title="البنود"
        icon={ListChecks}
        action={
          <Button
            onClick={() => {
              setSelectedItem(null);
              setDialogOpen(true);
            }}
          >
            إضافة بند جديد
          </Button>
        }
      />

      <ItemsTable
        data={items}
        loading={itemsQuery.isLoading}
        onEdit={(item) => {
          setSelectedItem(item);
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
        onShowMaterials={(item) => {
          setMaterialsItem(item);
          setMaterialsDialogOpen(true);
        }}
      />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
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

      <MaterialsDialog
        open={materialsDialogOpen}
        onOpenChange={(open) => {
          setMaterialsDialogOpen(open);
          if (!open) setMaterialsItem(null);
        }}
        item={materialsItem}
      />
    </div>
  );
}
