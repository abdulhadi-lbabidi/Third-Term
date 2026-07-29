import { useState } from 'react';
// import { Building2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { DepartmentTable } from './components/department.table';
import { DepartmentDialog } from './components/department.dialog';
import { PageHeader } from '../components/page-header';
import type { Department, CreateDepartmentPayload } from './types';
import { useDepartments, useMutateDepartment, useDeleteDepartment } from './departments.hooks';
import { Building2 } from 'lucide-react';

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
      <PageHeader
        badge="الهيكلية الإدارية"
        title="الأقسام"
        icon={Building2}
        action={
          <Button onClick={openCreateDialog}>إضافة قسم جديد</Button>
        }
      />
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
