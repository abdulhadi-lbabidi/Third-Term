import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { usersApi } from '@/features/users/api/users.api';
import type { EmployeeRecord } from '@/features/users/types';
import { employeePaymentsApi } from './employee-payments.api';
import { EmployeePaymentsDialog } from './components/employee-payments.dialog';
import { EmployeePaymentsTable } from './components/employee-payments.table';
import type { CreateEmployeePaymentPayload, EmployeePayment } from './types';
import { PageHeader } from '../components/page-header';

const employeePaymentsQueryKeys = {
  all: ['employee-payments'] as const,
};

export function EmployeePaymentsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<EmployeePayment | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    params.employeeId ? Number(params.employeeId) : null
  );

  const paymentsQuery = useQuery<EmployeePayment[]>({
    queryKey: employeePaymentsQueryKeys.all,
    queryFn: () => employeePaymentsApi.getEmployeePayments(),
  });

  const employeesQuery = useQuery<EmployeeRecord[]>({
    queryKey: ['employees'] as const,
    queryFn: () => usersApi.getUsersByRole('employee') as Promise<EmployeeRecord[]>,
  });

  useEffect(() => {
    if (params.employeeId) {
      setSelectedEmployeeId(Number(params.employeeId));
    }
  }, [params.employeeId]);

  const selectedEmployee = employeesQuery.data?.find((employee) => employee.id === selectedEmployeeId) ?? null;

  const visiblePayments = useMemo(() => {
    const payments = paymentsQuery.data ?? [];
    if (!selectedEmployeeId) return payments;
    return payments.filter((payment) => payment.employee_id === selectedEmployeeId);
  }, [paymentsQuery.data, selectedEmployeeId]);

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateEmployeePaymentPayload) => {
      if (selectedPayment) {
        return employeePaymentsApi.updateEmployeePayment(selectedPayment.id, payload);
      }
      return employeePaymentsApi.createEmployeePayment(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeePaymentsQueryKeys.all });
      setDialogOpen(false);
      setSelectedPayment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (payment: EmployeePayment) => employeePaymentsApi.deleteEmployeePayment(payment.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeePaymentsQueryKeys.all });
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
    <div className="space-y-5">
      <PageHeader
        badge="الموظفون"
        title={selectedEmployee ? `رواتب ${selectedEmployee.user.name}` : 'رواتب الموظفين'}
        action={
          <div className="flex shrink-0 items-center gap-3">
            {!params.employeeId ? (
              <div className="flex shrink-0 items-center gap-3">
              <select
                className="h-11 w-[210px] shrink-0 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900"
                value={selectedEmployeeId ? String(selectedEmployeeId) : ''}
                onChange={(event) => setSelectedEmployeeId(event.target.value ? Number(event.target.value) : null)}
              >
                <option value="">كل الموظفين</option>
                {employeesQuery.data?.map((employee) => (
                  <option key={employee.id} value={String(employee.id)}>
                    {employee.user.name}
                  </option>
                ))}
              </select>
              {selectedEmployeeId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedEmployeeId(null)}
                  className="h-11 w-11 rounded-lg border-slate-200 px-0 text-sm font-semibold"
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
                className="h-11 shrink-0 rounded-lg border-slate-200 px-5 text-sm font-semibold"
              >
                عرض كل الموظفين
              </Button>
            ) : null}
            <Button
              onClick={() => {
                setSelectedPayment(null);
                setDialogOpen(true);
              }}
              className="h-11 shrink-0 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800"
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
