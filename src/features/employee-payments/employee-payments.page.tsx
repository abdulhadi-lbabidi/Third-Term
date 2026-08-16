import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, BadgeDollarSign, Plus, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { usersApi } from '@/features/users/api/users.api';
import { employeePaymentsApi, type EmployeePaymentResponse, type EmployeePaymentFilters } from './employee-payments.api';
import { EmployeePaymentsDialog } from './components/employee-payments.dialog';
import { EmployeePaymentsTable } from './components/employee-payments.table';
import type { CreateEmployeePaymentPayload, EmployeePayment } from './types';
import { PageHeader } from '../components/page-header';
import { SimplePagination } from '@/components/ui/pagination';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { FilterDrawer } from '@/shared/components/ui/filter-drawer';
import { cn } from '@/shared/lib/utils';
import { DateTimeRangePicker, type DateTimeRangeValue } from '@/shared/components/ui/date-time-range-picker';
import { format } from 'date-fns';


export function EmployeePaymentsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 50;
  const [sort, setSort] = useState<string | undefined>(undefined);

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const rangeValue = useMemo(() => {
    return {
      from: dateFrom ? new Date(dateFrom) : undefined,
      to: dateTo ? new Date(dateTo) : undefined,
    };
  }, [dateFrom, dateTo]);

  const handleRangeChange = (value: DateTimeRangeValue | undefined) => {
    setDateFrom(value?.from ? format(value.from, 'yyyy-MM-dd HH:mm:ss') : '');
    setDateTo(value?.to ? format(value.to, 'yyyy-MM-dd HH:mm:ss') : '');
  };

  const [appliedFilters, setAppliedFilters] = useState<EmployeePaymentFilters>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<EmployeePayment | null>(null);
  const isProfileView = params.role === 'employee' && Boolean(params.id);

  const resolvedEmployeeId = params.employeeId
    ? Number(params.employeeId)
    : null;
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(resolvedEmployeeId);
  const [employeeSelectOpen, setEmployeeSelectOpen] = useState(false);

  const effectiveEmployeeId = useMemo(() => {
    if (params.employeeId) return Number(params.employeeId);
    if (isProfileView) return Number(params.id);
    return null;
  }, [params.employeeId, isProfileView, params.id]);

  const paymentsQuery = useQuery<EmployeePaymentResponse>({
    queryKey: ['employee-payments', page, perPage, sort, appliedFilters, effectiveEmployeeId, selectedEmployeeId],
    queryFn: () => employeePaymentsApi.getEmployeePayments(page, perPage, sort, {
      ...appliedFilters,
      employee_id: effectiveEmployeeId || selectedEmployeeId || undefined,
    }),
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchQuery || undefined,
      payment_date: paymentDate || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPaymentDate('');
    setDateFrom('');
    setDateTo('');
    setAppliedFilters({});
    setPage(1);
  };

  const employeesQuery = useQuery({
    queryKey: ['employees'] as const,
    queryFn: () => usersApi.getUsersByRole('employee'),
    enabled: employeeSelectOpen || dialogOpen || isProfileView,
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

  const isEmployeeActive = useMemo(() => {
    if (!isProfileView) return true;
    if (!profileEmployee) return true;
    return !profileEmployee.status || profileEmployee.status === 'active';
  }, [isProfileView, profileEmployee]);



  useEffect(() => {
    if (resolvedEmployeeId !== null) {
      setSelectedEmployeeId(resolvedEmployeeId);
    }
  }, [resolvedEmployeeId]);

  const selectedEmployee = employeesList.find((employee: any) => employee.id === selectedEmployeeId) ?? null;

  const payments = paymentsQuery.data?.data ?? [];
  const meta = paymentsQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  const visiblePayments = payments;

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateEmployeePaymentPayload) => {
      if (selectedPayment) {
        return employeePaymentsApi.updateEmployeePayment(selectedPayment.id, payload);
      }
      return employeePaymentsApi.createEmployeePayment(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employee-payments'] });
      setDialogOpen(false);
      setSelectedPayment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (payment: EmployeePayment) => employeePaymentsApi.deleteEmployeePayment(payment.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['employee-payments'] });
    },
  });

  const handleSubmit = async (payload: CreateEmployeePaymentPayload) => {
    await saveMutation.mutateAsync(payload);
    toast.success(selectedPayment ? 'تم تعديل راتب الموظف بنجاح' : 'تم إنشاء راتب الموظف بنجاح');
  };

  const handleDelete = async (payment: EmployeePayment) => {
    await deleteMutation.mutateAsync(payment);
    toast.success('تم حذف راتب الموظف بنجاح');
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        badge="الموظفون"
        title={selectedEmployee ? `رواتب ${selectedEmployee.user.name}` : (profileEmployee ? `رواتب ${profileEmployee.user?.name ?? profileEmployee.name}` : 'رواتب الموظفين')}
        icon={BadgeDollarSign}
        action={
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap">
            {!params.employeeId && !isProfileView ? (
              <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
                <div className="min-w-0 flex-1 sm:w-[210px] sm:flex-none">
                  <SearchableSelect
                    value={selectedEmployeeId}
                    onValueChange={(value) => setSelectedEmployeeId(value ? Number(value) : null)}
                    onOpenChange={setEmployeeSelectOpen}
                    loading={employeesQuery.isLoading}
                    options={employeesList.map((employee: any) => ({
                      value: employee.id,
                      label: employee.user.name,
                    }))}
                    placeholder="كل الموظفين"
                    searchPlaceholder="ابحث عن موظف..."
                    emptyMessage="لا يوجد موظفون."
                  />
                </div>
                {selectedEmployeeId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setSelectedEmployeeId(null)}
                    aria-label="عرض الكل"
                    title="عرض الكل"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                ) : null}
              </div>
            ) : null}
            {params.employeeId ? (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate('/employee-payments')}
              >
                عرض كل الموظفين
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className={cn("min-w-0 flex-1 sm:flex-none", Object.values(appliedFilters).some(Boolean) && "border-primary text-primary")}
            >
              <SlidersHorizontal className="size-4" />
              فلترة متقدمة
            </Button>
            {isEmployeeActive && (
              <Button
                className="min-w-0 flex-1 sm:flex-none"
                onClick={() => {
                  setSelectedPayment(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="size-4" />
                <span className="truncate">إضافة راتب جديد</span>
              </Button>
            )}
          </div>
        }
      />

      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="filter-search">البحث العام (الاسم أو البريد)</Label>
            <Input
              id="filter-search"
              type="text"
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-payment-date">تاريخ الدفع</Label>
            <Input
              id="filter-payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>مجال التاريخ والوقت</Label>
            <DateTimeRangePicker
              value={rangeValue}
              onChange={handleRangeChange}
            />
          </div>
        </div>
      </FilterDrawer>

      <EmployeePaymentsTable
        data={visiblePayments}
        loading={paymentsQuery.isLoading}
        sort={sort}
        onSortChange={setSort}
        onEdit={(payment) => {
          setSelectedPayment(payment);
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

      <EmployeePaymentsDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedPayment(null);
        }}
        employees={employeesList}
        employeePayment={selectedPayment}
        lockedEmployeeId={effectiveEmployeeId}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />
    </div>
  );
}
