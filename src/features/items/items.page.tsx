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
import { ListChecks, Search, RotateCcw } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

export function ItemsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 50;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [materialsDialogOpen, setMaterialsDialogOpen] = useState(false);
  const [materialsItem, setMaterialsItem] = useState<Item | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);

  const itemsQuery = useQuery<ItemResponse>({
    queryKey: ['items', page, perPage, search, sort],
    queryFn: () => itemsApi.getItems(page, perPage, {
      'filter[search]': search || undefined,
      sort: sort || undefined,
    }),
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

  const handleSearchSubmit = () => {
    setSearch(searchQuery);
    setPage(1);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearch('');
    setSort(undefined);
    setPage(1);
    queryClient.invalidateQueries({
      queryKey: ['items', 1, perPage, '', undefined],
    });
  };

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
    <div className="flex min-w-0 flex-1 flex-col space-y-4">
      <PageHeader
        badge="البنود"
        title="البنود"
        icon={ListChecks}
        action={
          <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto lg:flex-nowrap">
            <div className="relative basis-full sm:basis-auto sm:flex-1 lg:w-80 lg:flex-none">
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground inline-flex items-center justify-center p-0 border-none bg-transparent cursor-pointer"
              >
                <Search className="size-4" />
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit();
                  }
                }}
                placeholder="ابحث باسم البند أو البيان..."
                className="h-10 w-full rounded-md border border-input bg-card py-1.5 pl-9 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 sm:text-xs"
              />
            </div>
            {(search || sort) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="size-10 shrink-0 p-0"
                aria-label="إعادة ضبط البحث"
                title="إعادة ضبط البحث"
              >
                <RotateCcw className="size-4" />
              </Button>
            )}
            <Button
              className="h-10 shrink-0 px-3 sm:px-4"
              onClick={() => {
                setSelectedItem(null);
                setDialogOpen(true);
              }}
            >
              إضافة بند جديد
            </Button>
          </div>
        }
      />

      <div className="min-w-0">
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
          sort={sort}
          onSortChange={setSort}
        />
      </div>

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
      />

      <ItemsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />

      <MaterialsDialog
        open={materialsDialogOpen}
        onOpenChange={setMaterialsDialogOpen}
        item={materialsItem}
      />
    </div>
  );
}
