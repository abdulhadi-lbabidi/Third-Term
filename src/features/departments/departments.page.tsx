import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { DepartmentTable } from './components/department.table';
import { DepartmentDialog } from './components/department.dialog';
import { PageHeader } from '../components/page-header';
import type { Department, CreateDepartmentPayload } from './types';
import { useDepartments, useMutateDepartment, useDeleteDepartment } from './departments.hooks';
import { Building2, Search, RotateCcw } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';
import { Input } from '@/shared/components/ui/input';

export function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 50;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const [searchVal, setSearchVal] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);

  const { data: response, isLoading: loading } = useDepartments(page, perPage, {
    'filter[search]': appliedSearch || undefined,
    sort: sort || undefined,
  });
  const { mutateAsync: saveDepartment, isPending: isSaving } = useMutateDepartment();
  const { mutateAsync: deleteDepartment } = useDeleteDepartment();

  const handleSearchSubmit = () => {
    setAppliedSearch(searchVal);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchVal('');
    setAppliedSearch('');
    setSort(undefined);
    setPage(1);
    queryClient.invalidateQueries({
      queryKey: ['departments', 1, perPage, { sort: undefined }],
    });
  };

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

  const departments = response?.data ?? [];
  const meta = response?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="الهيكلية الإدارية"
        title="الأقسام"
        icon={Building2}
        action={
          <div className="flex shrink-0 items-center gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit();
              }}
              className="relative flex items-center animate-fade-in"
            >
              <Input
                type="text"
                placeholder="البحث بالاسم..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="h-9 w-48 pl-8 pr-3 text-xs"
              />
              <button
                type="submit"
                className="absolute left-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                title="بحث"
              >
                <Search className="size-4" />
              </button>
            </form>

            {(appliedSearch || sort) ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleResetFilters}
                aria-label="إعادة ضبط"
                title="إعادة ضبط"
              >
                <RotateCcw className="size-4" />
              </Button>
            ) : null}

            <Button onClick={openCreateDialog}>إضافة قسم جديد</Button>
          </div>
        }
      />
      <DepartmentTable
        data={departments}
        loading={loading}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        sort={sort}
        onSortChange={setSort}
      />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
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
