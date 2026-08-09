import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { materialsApi } from './materials.api';
import { MaterialDialog } from './components/material.dialog';
import { MaterialsTable } from './components/materials.table';
import type { CreateMaterialPayload, Material, MaterialResponse } from './types';
import { Boxes, Search, RotateCcw } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

export function MaterialsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);

  const materialsQuery = useQuery<MaterialResponse>({
    queryKey: ['materials', page, perPage, search, sort],
    queryFn: () => materialsApi.getMaterials(page, perPage, search, sort),
    placeholderData: keepPreviousData,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateMaterialPayload) => {
      if (selectedMaterial) {
        return materialsApi.updateMaterial(selectedMaterial.id, payload);
      }
      return materialsApi.createMaterial(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['materials'] });
      setDialogOpen(false);
      setSelectedMaterial(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (material: Material) => materialsApi.deleteMaterial(material.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['materials'] });
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
  };

  const handleSubmit = async (payload: CreateMaterialPayload) => {
    await saveMutation.mutateAsync(payload);
    toast.success(selectedMaterial ? 'تم تعديل المادة بنجاح' : 'تم إنشاء المادة بنجاح');
  };

  const handleDelete = async (material: Material) => {
    await deleteMutation.mutateAsync(material);
    toast.success('تم حذف المادة بنجاح');
  };

  const materials = materialsQuery.data?.data ?? [];
  const meta = materialsQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex min-w-0 flex-1 flex-col space-y-4">
      <PageHeader
        badge="المواد"
        title="المواد"
        icon={Boxes}
        action={
          <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto lg:flex-nowrap">
            <div className="relative basis-full sm:basis-auto sm:flex-1 lg:w-64 lg:flex-none">
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
                placeholder="ابحث بالاسم، البيان، أو الوحدة..."
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
                setSelectedMaterial(null);
                setDialogOpen(true);
              }}
            >
              إضافة مادة جديدة
            </Button>
          </div>
        }
      />

      <div className="min-w-0">
        <MaterialsTable
          data={materials}
          loading={materialsQuery.isLoading}
          onEdit={(material) => {
            setSelectedMaterial({
              ...material,
              item_id: material.item_id ?? material.item?.id,
              item: material.item,
            });
            setDialogOpen(true);
          }}
          onDelete={handleDelete}
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

      <MaterialDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedMaterial(null);
        }}
        material={selectedMaterial}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />
    </div>
  );
}
