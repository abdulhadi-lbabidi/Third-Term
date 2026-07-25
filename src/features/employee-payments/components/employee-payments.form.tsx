import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import type { CreateEmployeePaymentPayload, EmployeePayment } from '../types';
import type { EmployeeRecord } from '@/features/users/types';

type EmployeePaymentsFormValues = CreateEmployeePaymentPayload;

type EmployeePaymentsFormProps = {
  employees: EmployeeRecord[];
  defaultValues?: EmployeePayment | null;
  lockedEmployeeId?: number | null;
  onSubmit: (data: EmployeePaymentsFormValues) => Promise<void>;
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
  const form = useForm<EmployeePaymentsFormValues>({
    defaultValues: {
      employee_id: lockedEmployeeId ?? defaultValues?.employee_id ?? employees[0]?.id ?? 0,
      bonuses: defaultValues?.bonuses ?? 0,
      deductions: defaultValues?.deductions ?? 0,
      payment_date: defaultValues?.payment_date ?? today,
      amount: defaultValues?.amount ?? 0,
    },
  });

  useEffect(() => {
    form.reset({
      employee_id: lockedEmployeeId ?? defaultValues?.employee_id ?? employees[0]?.id ?? 0,
      bonuses: defaultValues?.bonuses ?? 0,
      deductions: defaultValues?.deductions ?? 0,
      payment_date: defaultValues?.payment_date ?? today,
      amount: defaultValues?.amount ?? 0,
    });
  }, [defaultValues, employees, form, lockedEmployeeId]);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
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
                  value={field.value ? String(field.value) : ''}
                  onChange={(event) => field.onChange(Number(event.target.value))}
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
                <Input type="number" step="0.01" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                <Input type="number" step="0.01" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                <Input type="number" step="0.01" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
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
