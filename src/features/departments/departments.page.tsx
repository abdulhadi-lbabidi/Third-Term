import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { DepartmentTable } from './components/department.table';
import { DepartmentDialog } from './components/department.dialog';
import type { Department, CreateDepartmentPayload } from './types';
import { useDepartments, useMutateDepartment, useDeleteDepartment } from './departments.hooks';

export function DepartmentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const { data: departments = [], isLoading: loading } = useDepartments();
  const { mutateAsync: saveDepartment, isPending: isSaving } = useMutateDepartment();
  const { mutateAsync: deleteDepartment } = useDeleteDepartment();

  const handleCreateOrUpdate = async (payload: CreateDepartmentPayload) => {
    await saveDepartment({ id: selectedDepartment?.id, payload });
    setDialogOpen(false);
  };

  const handleDelete = async (department: Department) => {
    await deleteDepartment(department.id);
  };

  const openCreateDialog = () => {
    setSelectedDepartment(null);
    setDialogOpen(true);
  };

  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              الهيكلية الإدارية
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">الأقسام</h1>
          </div>
          <Button
            onClick={openCreateDialog}
            className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
          >
            إضافة قسم جديد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Building2 className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">إجمالي الأقسام</p>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">{departments.length}</h3>
            </div>
          </div>
        </div>
      </div>

      <DepartmentTable
        data={departments}
        loading={loading}
        onEdit={openEditDialog}
        onDelete={handleDelete}
      />

      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={selectedDepartment}
        onSubmit={handleCreateOrUpdate}
        loading={isSaving}
      />
    </div>
  );
}
