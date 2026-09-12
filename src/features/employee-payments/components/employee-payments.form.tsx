import { useEffect, useMemo } from 'react';
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
import { cn, formatArabicDate } from '@/shared/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { companyFundsApi } from '@/features/company-funds/company-funds.api';
import type { EmployeeRecord } from '@/features/users/types';
import type { CreateEmployeePaymentPayload, EmployeePayment } from '../types';
import { employeePaymentFormSchema, type EmployeePaymentFormValues } from '../schemas/employee-payments.schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';

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
  const companyFunds = useMemo(() => {
    const list = companyFundsQuery.data?.data ?? (Array.isArray(companyFundsQuery.data) ? companyFundsQuery.data : []);
    return [...list].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [companyFundsQuery.data]);
  const isLoadingCompanyFunds = companyFundsQuery.isLoading;

  const form = useForm<EmployeePaymentFormValues>({
    resolver: zodResolver(employeePaymentFormSchema),
    defaultValues: {
      employee_id: lockedEmployeeId ? String(lockedEmployeeId) : (defaultValues?.employee?.id ? String(defaultValues.employee.id) : (defaultValues?.employee_id ? String(defaultValues.employee_id) : '')),
      company_fund_currency_id: defaultValues?.company_fund_currency_id ? String(defaultValues.company_fund_currency_id) : defaultValues?.company_fund_currency?.id ? String(defaultValues.company_fund_currency.id) : '',
      bonuses: defaultValues?.bonuses ? String(defaultValues.bonuses) : '',
      deductions: defaultValues?.deductions ? String(defaultValues.deductions) : '',
      payment_date: defaultValues?.payment_date ?? today,
      amount: defaultValues?.amount ? String(defaultValues.amount) : '',
    },
  });

  useEffect(() => {
    form.reset({
      employee_id: lockedEmployeeId ? String(lockedEmployeeId) : (defaultValues?.employee?.id ? String(defaultValues.employee.id) : (defaultValues?.employee_id ? String(defaultValues.employee_id) : '')),
      company_fund_currency_id: defaultValues?.company_fund_currency_id ? String(defaultValues.company_fund_currency_id) : defaultValues?.company_fund_currency?.id ? String(defaultValues.company_fund_currency.id) : '',
      bonuses: defaultValues?.bonuses ? String(defaultValues.bonuses) : '',
      deductions: defaultValues?.deductions ? String(defaultValues.deductions) : '',
      payment_date: defaultValues?.payment_date ?? today,
      amount: defaultValues?.amount ? String(defaultValues.amount) : '',
    });
  }, [defaultValues, form, lockedEmployeeId, today]);

  const watchedAmount = form.watch('amount');
  const watchedBonuses = form.watch('bonuses');
  const watchedDeductions = form.watch('deductions');

  const total = useMemo(() => {
    const rawAmount = String(watchedAmount ?? '').replace(/,/g, '').trim();
    const rawBonuses = String(watchedBonuses ?? '').replace(/,/g, '').trim();
    const rawDeductions = String(watchedDeductions ?? '').replace(/,/g, '').trim();

    const parsedAmount = rawAmount ? parseFloat(rawAmount) : 0;
    const parsedBonuses = rawBonuses ? parseFloat(rawBonuses) : 0;
    const parsedDeductions = rawDeductions ? parseFloat(rawDeductions) : 0;

    const validAmount = Number.isNaN(parsedAmount) ? 0 : parsedAmount;
    const validBonuses = Number.isNaN(parsedBonuses) ? 0 : parsedBonuses;
    const validDeductions = Number.isNaN(parsedDeductions) ? 0 : parsedDeductions;

    return validAmount + validBonuses - validDeductions;
  }, [watchedAmount, watchedBonuses, watchedDeductions]);

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
          render={({ field }) => {
            const rawList = Array.isArray(employees) ? employees : (employees as any)?.data ?? [];
            const employeesList = rawList.filter((emp: any) => {
              const isActive = !emp.status || emp.status === 'active';
              const isSelected = String(emp.id) === String(field.value);
              return isActive || isSelected;
            });
            const selectedEmployeeLabel = (() => {
              if (!field.value) return null;
              const found = employeesList.find((emp: any) => String(emp.id) === String(field.value));
              if (found) {
                const name = found.user?.name ?? found.name ?? `موظف #${found.id}`;
                const title = found.job_title ? ` (${found.job_title})` : '';
                return `${name}${title}`;
              }
              if (defaultValues?.employee && String(defaultValues.employee.id) === String(field.value)) {
                const emp = defaultValues.employee;
                const name = emp.user?.name ?? `موظف #${emp.id}`;
                const title = emp.job_title ? ` (${emp.job_title})` : '';
                return `${name}${title}`;
              }
              return null;
            })();

            return (
              <FormItem>
                <FormLabel>الموظف</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={Boolean(lockedEmployeeId)}
                >
                  <FormControl>
                    <SelectTrigger disabled={Boolean(lockedEmployeeId)}>
                      <SelectValue placeholder="اختر الموظف">
                        {selectedEmployeeLabel}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employeesList.map((emp: any) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.user?.name ?? emp.name ?? `موظف #${emp.id}`} ({emp.job_title ?? ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="company_fund_currency_id"
          render={({ field }) => {
            const selectedLabel = (() => {
              if (!field.value) return null;
              for (const fund of companyFunds) {
                for (const curr of fund.currencies ?? []) {
                  if (String(curr.id) === String(field.value)) {
                    return `${fund.name} - ${curr.currency} (${Number(curr.balance ?? 0).toLocaleString()})`;
                  }
                }
              }
              if (defaultValues?.company_fund_currency && String(defaultValues.company_fund_currency.id) === String(field.value)) {
                const cfc = defaultValues.company_fund_currency;
                const fundName = cfc.company_fund?.name ?? '';
                const currName = cfc.currency?.currency ?? '';
                const bal = cfc.balance ?? '';
                return `${fundName} - ${currName} (${Number(bal ?? 0).toLocaleString()})`;
              }
              return null;
            })();

            return (
              <FormItem>
                <FormLabel>عملة صندوق الشركة</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingCompanyFunds}
                >
                  <FormControl>
                    <SelectTrigger disabled={isLoadingCompanyFunds}>
                      <SelectValue placeholder={isLoadingCompanyFunds ? 'جاري التحميل...' : 'اختر عملة الصندوق'}>
                        {selectedLabel}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companyFunds.flatMap((fund: any) =>
                      (fund.currencies ?? []).map((curr: any) => (
                        <SelectItem key={curr.id} value={String(curr.id)}>
                          {fund.name} - {curr.currency} ({Number(curr.balance ?? 0).toLocaleString()})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
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

          <FormField
            control={form.control}
            name="deductions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الاستقطاعات</FormLabel>
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

        <div className="space-y-2">
          <Label>الإجمالي</Label>
          <Input
            type="text"
            readOnly
            disabled
            value={formatNumberWithCommas(total)}
            className="bg-muted font-semibold text-foreground cursor-not-allowed"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </form>
    </Form>
  );
}
