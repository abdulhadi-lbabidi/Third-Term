import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import type { EmployeeRecord } from '@/features/users/types';
import type { CreateEmployeePaymentPayload, EmployeePayment } from '../types';
import { employeePaymentFormSchema, type EmployeePaymentFormValues } from '../schemas/employee-payments.schema';

type EmployeePaymentsFormProps = {
  employees: EmployeeRecord[];
  defaultValues?: EmployeePayment | null;
  lockedEmployeeId?: number | null;
  onSubmit: (data: CreateEmployeePaymentPayload) => Promise<void>;
  loading?: boolean;
};

const today = new Date().toISOString().slice(0, 10);

export function EmployeePaymentsForm({
  employees,
  defaultValues,
  lockedEmployeeId,
  onSubmit,
  loading,
}: EmployeePaymentsFormProps) {
  const form = useForm<EmployeePaymentFormValues>({
    resolver: zodResolver(employeePaymentFormSchema),
    defaultValues: {
      employee_id: lockedEmployeeId ? String(lockedEmployeeId) : defaultValues?.employee_id ? String(defaultValues.employee_id) : '',
      bonuses: defaultValues?.bonuses ? String(defaultValues.bonuses) : '',
      deductions: defaultValues?.deductions ? String(defaultValues.deductions) : '',
      payment_date: defaultValues?.payment_date ?? today,
      amount: defaultValues?.amount ? String(defaultValues.amount) : '',
    },
  });

  useEffect(() => {
    form.reset({
      employee_id: lockedEmployeeId ? String(lockedEmployeeId) : defaultValues?.employee_id ? String(defaultValues.employee_id) : '',
      bonuses: defaultValues?.bonuses ? String(defaultValues.bonuses) : '',
      deductions: defaultValues?.deductions ? String(defaultValues.deductions) : '',
      payment_date: defaultValues?.payment_date ?? today,
      amount: defaultValues?.amount ? String(defaultValues.amount) : '',
    });
  }, [defaultValues, employees, form, lockedEmployeeId]);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit({
            employee_id: Number(values.employee_id),
            bonuses: Number(values.bonuses),
            deductions: Number(values.deductions),
            payment_date: values.payment_date,
            amount: Number(values.amount),
          });
        })}
      >
        <FormField
          control={form.control}
          name="employee_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الموظف</FormLabel>
              <FormControl>
                <select
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={Boolean(lockedEmployeeId)}
                >
                  <option value="" disabled>
                    اختر الموظف
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={String(employee.id)}>
                      {employee.user.name}
                    </option>
                  ))}
                </select>
              </FormControl>
            
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bonuses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الزيادات</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deductions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاستقطاعات</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تاريخ الدفع</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المبلغ</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </form>
    </Form>
  );
}
