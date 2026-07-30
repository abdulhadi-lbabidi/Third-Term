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
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Calendar } from '@/shared/components/ui/calendar';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { cn, formatArabicDate } from '@/shared/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { companyFundsApi } from '@/features/company-funds/company-funds.api';
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
  const { data: companyFunds = [], isLoading: isLoadingCompanyFunds } = useQuery({
    queryKey: ['company-funds', { paginate: false }],
    queryFn: () => companyFundsApi.getCompanyFunds({ paginate: false }),
  });

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
            company_fund_currency_id: values.company_fund_currency_id ? Number(values.company_fund_currency_id) : undefined,
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
                <SearchableSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={employees.map((employee) => ({
                    value: String(employee.id),
                    label: employee.user.name,
                  }))}
                  placeholder="اختر الموظف"
                  disabled={Boolean(lockedEmployeeId)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company_fund_currency_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel> صندوق الشركة</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={companyFunds.flatMap((fund) =>
                    (fund.currencies ?? []).map((currency) => ({
                      value: String(currency.id),
                      label: `${fund.name} - ${currency.currency} (${currency.balance} ${currency.symbol})`,
                    }))
                  )}
                  placeholder="اختر عملة صندوق الشركة"
                  disabled={isLoadingCompanyFunds}
                />
              </FormControl>
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
            <FormItem className="flex flex-col">
              <FormLabel>تاريخ الدفع</FormLabel>
              <Popover>
                <PopoverTrigger>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-right font-normal h-11 px-4 py-2 flex justify-between items-center',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        formatArabicDate(new Date(field.value))
                      ) : (
                        <span>اختر التاريخ</span>
                      )}
                      <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                  />
                </PopoverContent>
              </Popover>
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
