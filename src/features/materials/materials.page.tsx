import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '../components/page-header';
import { materialsApi } from './materials.api';
import { MaterialDialog } from './components/material.dialog';
import { MaterialsTable } from './components/materials.table';
import type { CreateMaterialPayload, Material } from './types';

const materialsQueryKeys = {
  all: ['materials'] as const,
};

export function MaterialsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const materialsQuery = useQuery<Material[]>({
    queryKey: materialsQueryKeys.all,
    queryFn: () => materialsApi.getMaterials(),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateMaterialPayload) => {
      if (selectedMaterial) {
        return materialsApi.updateMaterial(selectedMaterial.id, payload);
      }
      return materialsApi.createMaterial(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: materialsQueryKeys.all });
      setDialogOpen(false);
      setSelectedMaterial(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (material: Material) => materialsApi.deleteMaterial(material.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: materialsQueryKeys.all });
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

  return (
    <div className="space-y-5">
      <PageHeader
        badge="المواد"
        title="المواد"
        action={
          <Button
            onClick={() => {
              setSelectedMaterial(null);
              setDialogOpen(true);
            }}
            className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
          >
            إضافة مادة جديدة
          </Button>
        }
      />

      <MaterialsTable
        data={materialsQuery.data ?? []}
        loading={materialsQuery.isLoading}
        onEdit={(material) => {
          setSelectedMaterial(material);
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
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
