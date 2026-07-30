import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
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
import { companyFundsApi } from '@/features/company-funds/company-funds.api';
import type { EmployeeRecord } from '@/features/users/types';
import type { CreateEmployeePaymentPayload, EmployeePayment } from '../types';
import { employeePaymentFormSchema, type EmployeePaymentFormValues } from '../schemas/employee-payments.schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

type EmployeePaymentsFormProps = {
  employees: EmployeeRecord[];
  defaultValues?: EmployeePayment | null;
  lockedEmployeeId?: number | null;
  onSubmit: (data: CreateEmployeePaymentPayload) => Promise<void>;
  loading?: boolean;
};

const today = new Date().toISOString().slice(0, 10);

function formatNumberWithCommas(value: unknown): string {
  if (value === undefined || value === null || value === '' || Number.isNaN(value)) return '';
  const str = String(value).replace(/,/g, '');
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function EmployeePaymentsForm({
  employees,
  defaultValues,
  lockedEmployeeId,
  onSubmit,
  loading,
}: EmployeePaymentsFormProps) {
  const companyFundsQuery = useQuery({
    queryKey: ['company-funds'],
    queryFn: () => companyFundsApi.getCompanyFunds(),
  });
  const companyFunds = companyFundsQuery.data?.data ?? (Array.isArray(companyFundsQuery.data) ? companyFundsQuery.data : []);
  const isLoadingCompanyFunds = companyFundsQuery.isLoading;

  const form = useForm<EmployeePaymentFormValues>({
    resolver: zodResolver(employeePaymentFormSchema),
    defaultValues: {
      employee_id: lockedEmployeeId ? String(lockedEmployeeId) : defaultValues?.employee_id ? String(defaultValues.employee_id) : '',
      company_fund_currency_id: defaultValues?.company_fund_currency_id ? String(defaultValues.company_fund_currency_id) : '',
      bonuses: defaultValues?.bonuses ? String(defaultValues.bonuses) : '',
      deductions: defaultValues?.deductions ? String(defaultValues.deductions) : '',
      payment_date: defaultValues?.payment_date ?? today,
      amount: defaultValues?.amount ? String(defaultValues.amount) : '',
    },
  });

  useEffect(() => {
    form.reset({
      employee_id: lockedEmployeeId ? String(lockedEmployeeId) : defaultValues?.employee_id ? String(defaultValues.employee_id) : '',
      company_fund_currency_id: defaultValues?.company_fund_currency_id ? String(defaultValues.company_fund_currency_id) : '',
      bonuses: defaultValues?.bonuses ? String(defaultValues.bonuses) : '',
      deductions: defaultValues?.deductions ? String(defaultValues.deductions) : '',
      payment_date: defaultValues?.payment_date ?? today,
      amount: defaultValues?.amount ? String(defaultValues.amount) : '',
    });
  }, [defaultValues, form, lockedEmployeeId]);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit({
            employee_id: Number(values.employee_id),
            company_fund_currency_id: Number(values.company_fund_currency_id),
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
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={Boolean(lockedEmployeeId)}
              >
                <FormControl>
                  <SelectTrigger disabled={Boolean(lockedEmployeeId)}>
                    <SelectValue placeholder="اختر الموظف" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.user.name} ({emp.job_title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company_fund_currency_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>عملة صندوق الشركة</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoadingCompanyFunds}
              >
                <FormControl>
                  <SelectTrigger disabled={isLoadingCompanyFunds}>
                    <SelectValue placeholder={isLoadingCompanyFunds ? 'جاري التحميل...' : 'اختر عملة الصندوق'} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companyFunds.flatMap((fund: any) =>
                    (fund.currencies ?? []).map((curr: any) => (
                      <SelectItem key={curr.id} value={String(curr.id)}>
                        {fund.name} - {curr.currency} ({curr.balance})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
        </div>

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
                  type="text"
                  inputMode="decimal"
                  value={formatNumberWithCommas(field.value)}
                  onChange={(event) => {
                    const raw = event.target.value.replace(/,/g, '');
                    if (/^\d*\.?\d*$/.test(raw)) {
                      field.onChange(raw);
                    }
                  }}
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
