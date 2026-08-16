import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpCircle, Plus, RotateCcw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { SimplePagination } from '@/components/ui/pagination';
import { usersApi } from '@/features/users/api/users.api';
import { PageHeader } from '../components/page-header';
import { incrementsApi, type IncrementResponse } from './increments.api';
import { IncrementsDialog } from './components/increments.dialog';
import { IncrementsTable } from './components/increments.table';
import type { CreateIncrementPayload, Increment, UpdateIncrementPayload } from './types';

export function IncrementsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 50;
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [searchVal, setSearchVal] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIncrement, setSelectedIncrement] = useState<Increment | null>(null);
  const isProfileView = params.role === 'employee' && Boolean(params.id);

  const effectiveEmployeeId = useMemo(() => {
    if (params.employeeId) return Number(params.employeeId);
    if (isProfileView) return Number(params.id);
    return null;
  }, [params.employeeId, isProfileView, params.id]);

  const handleSearchSubmit = () => {
    setAppliedSearch(searchVal.trim());
    setPage(1);
  };

  const handleResetSearch = () => {
    setSearchVal('');
    setAppliedSearch('');
    setPage(1);
  };

  const incrementsQuery = useQuery<IncrementResponse>({
    queryKey: ['increments', page, perPage, sort, appliedSearch, effectiveEmployeeId],
    queryFn: () =>
      incrementsApi.getIncrements(page, perPage, sort, {
        search: appliedSearch || undefined,
        employee_id: effectiveEmployeeId || undefined,
      }),
  });

  const employeesQuery = useQuery({
    queryKey: ['employees'] as const,
    queryFn: () => usersApi.getUsersByRole('employee'),
    enabled: dialogOpen || isProfileView,
  });

  const employeesList = useMemo(() => {
    const raw = employeesQuery.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && Array.isArray((raw as any).data)) return (raw as any).data;
    return [];
  }, [employeesQuery.data]);

  const profileEmployee = useMemo(() => {
    if (!isProfileView) return null;
    const targetEmployeeId = Number(params.id);
    return employeesList.find((emp: any) => emp.id === targetEmployeeId) ?? null;
  }, [employeesList, isProfileView, params.id]);

  const routeEmployee = useMemo(() => {
    if (!params.employeeId) return null;
    const targetEmployeeId = Number(params.employeeId);
    return employeesList.find((emp: any) => emp.id === targetEmployeeId) ?? null;
  }, [employeesList, params.employeeId]);

  const isEmployeeActive = useMemo(() => {
    if (!isProfileView) return true;
    if (!profileEmployee) return true;
    return !profileEmployee.status || profileEmployee.status === 'active';
  }, [isProfileView, profileEmployee]);

  const increments = incrementsQuery.data?.data ?? [];
  const meta = incrementsQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateIncrementPayload | UpdateIncrementPayload) => {
      if (selectedIncrement) {
        return incrementsApi.updateIncrement(selectedIncrement.id, payload);
      }
      return incrementsApi.createIncrement(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['increments'] });
      setDialogOpen(false);
      setSelectedIncrement(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (increment: Increment) => incrementsApi.deleteIncrement(increment.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['increments'] });
    },
  });

  const handleSubmit = async (payload: CreateIncrementPayload | UpdateIncrementPayload) => {
    await saveMutation.mutateAsync(payload);
    toast.success(selectedIncrement ? 'تم تعديل الزيادة بنجاح' : 'تم إنشاء الزيادة بنجاح');
  };

  const handleDelete = async (increment: Increment) => {
    await deleteMutation.mutateAsync(increment);
    toast.success('تم حذف الزيادة بنجاح');
  };

  const pageTitle = routeEmployee
    ? `زيادات ${routeEmployee.user?.name ?? routeEmployee.name}`
    : profileEmployee
      ? `زيادات ${profileEmployee.user?.name ?? profileEmployee.name}`
      : 'زيادات الموظفين';

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        badge="الموظفون"
        title={pageTitle}
        icon={ArrowUpCircle}
        action={
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap">
            {!params.employeeId && !isProfileView ? (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchSubmit();
                  }}
                  className="relative flex min-w-0 flex-1 items-center sm:w-[240px] sm:flex-none"
                >
                  <Input
                    type="text"
                    placeholder="ابحث بالسبب..."
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    className="h-9 pl-8 pr-3"
                  />
                  <button
                    type="submit"
                    className="absolute left-2.5 cursor-pointer text-muted-foreground hover:text-foreground"
                    title="بحث"
                    aria-label="بحث"
                  >
                    <Search className="size-4" />
                  </button>
                </form>
                {appliedSearch ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleResetSearch}
                    aria-label="إعادة ضبط"
                    title="إعادة ضبط"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                ) : null}
              </>
            ) : null}
            {params.employeeId ? (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate('/increments')}
              >
                عرض كل الموظفين
              </Button>
            ) : null}
            {isEmployeeActive && (
              <Button
                className="min-w-0 flex-1 sm:flex-none"
                onClick={() => {
                  setSelectedIncrement(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="size-4" />
                <span className="truncate">إضافة زيادة جديدة</span>
              </Button>
            )}
          </div>
        }
      />

      <IncrementsTable
        data={increments}
        loading={incrementsQuery.isLoading}
        sort={sort}
        onSortChange={setSort}
        onEdit={(increment) => {
          setSelectedIncrement(increment);
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

      <IncrementsDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedIncrement(null);
        }}
        employees={employeesList}
        increment={selectedIncrement}
        lockedEmployeeId={effectiveEmployeeId}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />
    </div>
  );
}
