import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { materialsApi } from './materials.api';
import { MaterialDialog } from './components/material.dialog';
import { MaterialsTable } from './components/materials.table';
import type { CreateMaterialPayload, Material, MaterialResponse } from './types';
import { Boxes } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

export function MaterialsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const materialsQuery = useQuery<MaterialResponse>({
    queryKey: ['materials', page, perPage],
    queryFn: () => materialsApi.getMaterials(page, perPage),
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
    <div className="flex flex-col flex-1 space-y-2">
      <PageHeader
        badge="المواد"
        title="المواد"
        icon={Boxes}
        action={
          <Button
            onClick={() => {
              setSelectedMaterial(null);
              setDialogOpen(true);
            }}
          >
            إضافة مادة جديدة
          </Button>
        }
      />

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
      />

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
