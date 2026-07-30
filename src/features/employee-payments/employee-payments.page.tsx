import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, BadgeDollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/button';
import { usersApi } from '@/features/users/api/users.api';
import type { EmployeeRecord } from '@/features/users/types';
import { employeePaymentsApi, type EmployeePaymentResponse } from './employee-payments.api';
import { EmployeePaymentsDialog } from './components/employee-payments.dialog';
import { EmployeePaymentsTable } from './components/employee-payments.table';
import type { CreateEmployeePaymentPayload, EmployeePayment } from './types';
import { PageHeader } from '../components/page-header';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { SimplePagination } from '@/components/ui/pagination';


export function EmployeePaymentsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 50;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<EmployeePayment | null>(null);
  const resolvedEmployeeId = params.employeeId
    ? Number(params.employeeId)
    : params.role === 'employee' && params.id
      ? Number(params.id)
      : null;
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(resolvedEmployeeId);

  const paymentsQuery = useQuery<EmployeePaymentResponse>({
    queryKey: ['employee-payments', page, perPage],
    queryFn: () => employeePaymentsApi.getEmployeePayments(page, perPage),
  });

  const employeesQuery = useQuery({
    queryKey: ['employees'] as const,
    queryFn: async () => {
      const res = await usersApi.getUsersByRole('employee');
      return (res as any)?.data ?? res;
    },
  });

  useEffect(() => {
    if (resolvedEmployeeId !== null) {
      setSelectedEmployeeId(resolvedEmployeeId);
    }
  }, [resolvedEmployeeId]);

  const selectedEmployee = (employeesQuery.data as EmployeeRecord[] | undefined)?.find((employee: EmployeeRecord) => employee.id === selectedEmployeeId) ?? null;

  const payments = paymentsQuery.data?.data ?? [];
  const meta = paymentsQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  const visiblePayments = useMemo(() => {
    if (!selectedEmployeeId) return payments;
    return payments.filter((payment) => payment.employee_id === selectedEmployeeId);
  }, [payments, selectedEmployeeId]);

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
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="الموظفون"
        title={selectedEmployee ? `رواتب ${selectedEmployee.user.name}` : 'رواتب الموظفين'}
        icon={BadgeDollarSign}
        action={
          <div className="flex shrink-0 items-center gap-3">
            {!params.employeeId ? (
              <div className="flex shrink-0 items-center gap-3">
                <div className="w-[210px] shrink-0">
                  <SearchableSelect
                    value={selectedEmployeeId ? String(selectedEmployeeId) : ''}
                    onValueChange={(val) => setSelectedEmployeeId(val ? Number(val) : null)}
                    options={[
                      { value: '', label: 'كل الموظفين' },
                      ...(employeesQuery.data?.map((e: any) => ({ value: String(e.id), label: e.user.name })) || [])
                    ]}
                    placeholder="كل الموظفين"
                    searchPlaceholder="ابحث عن موظف..."
                  />
                </div>
                {selectedEmployeeId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
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
                onClick={() => navigate('/employee-payments')}
              >
                عرض كل الموظفين
              </Button>
            ) : null}
            <Button
              onClick={() => {
                setSelectedPayment(null);
                setDialogOpen(true);
              }}
            >
              إضافة راتب جديد
            </Button>
          </div>
        }
      />

      <EmployeePaymentsTable
        data={visiblePayments}
        loading={paymentsQuery.isLoading}
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
        employees={employeesQuery.data ?? []}
        employeePayment={selectedPayment}
        lockedEmployeeId={params.employeeId ? Number(params.employeeId) : null}
        onSubmit={handleSubmit}
        loading={saveMutation.isPending}
      />
    </div>
  );
}
