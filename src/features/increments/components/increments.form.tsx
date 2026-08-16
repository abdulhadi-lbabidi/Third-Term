import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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
import { Textarea } from '@/shared/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Calendar } from '@/shared/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { cn, formatArabicDate } from '@/shared/lib/utils';
import type { EmployeeRecord } from '@/features/users/types';
import type { CreateIncrementPayload, Increment, UpdateIncrementPayload } from '../types';
import { incrementFormSchema, type IncrementFormValues } from '../schemas/increments.schema';

type IncrementsFormProps = {
  employees: EmployeeRecord[];
  defaultValues?: Increment | null;
  lockedEmployeeId?: number | null;
  onSubmit: (data: CreateIncrementPayload | UpdateIncrementPayload) => Promise<void>;
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

function normalizeDate(value?: string | null) {
  if (!value) return today;
  return value.slice(0, 10);
}

function getActiveEmployees(employees: EmployeeRecord[], selectedId?: string): EmployeeRecord[] {
  const rawList: EmployeeRecord[] = Array.isArray(employees) ? employees : [];
  return rawList.filter((emp: EmployeeRecord) => {
    const isActive = !emp.status || emp.status === 'active';
    const isSelected = selectedId ? String(emp.id) === String(selectedId) : false;
    return isActive || isSelected;
  });
}

function buildFormValues(
  defaultValues?: Increment | null,
  lockedEmployeeId?: number | null,
): IncrementFormValues {
  return {
    employee_id: lockedEmployeeId
      ? String(lockedEmployeeId)
      : defaultValues?.employee?.id
        ? String(defaultValues.employee.id)
        : '',
    date: normalizeDate(defaultValues?.date),
    amount: defaultValues?.amount !== undefined && defaultValues?.amount !== null
      ? String(defaultValues.amount)
      : '',
    reason: defaultValues?.reason ?? '',
  };
}

export function IncrementsForm({
  employees,
  defaultValues,
  lockedEmployeeId,
  onSubmit,
  loading,
}: IncrementsFormProps) {
  const form = useForm<IncrementFormValues>({
    resolver: zodResolver(incrementFormSchema),
    defaultValues: buildFormValues(defaultValues, lockedEmployeeId),
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          const payload = {
            employee_id: Number(values.employee_id),
            date: values.date,
            amount: Number(values.amount),
            reason: values.reason,
          };

          await onSubmit(payload);
        })}
      >
        <FormField
          control={form.control}
          name="employee_id"
          render={({ field }) => {
            const employeesList = getActiveEmployees(employees, field.value);
            const selectedEmployeeLabel = (() => {
              if (!field.value) return null;
              const found = employeesList.find((emp) => String(emp.id) === String(field.value));
              if (found) {
                const name = found.user?.name ?? `موظف #${found.id}`;
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
                      <SelectValue placeholder="اختر الموظف">{selectedEmployeeLabel}</SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employeesList.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.user?.name ?? `موظف #${emp.id}`} ({emp.job_title ?? ''})
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
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>التاريخ</FormLabel>
              <Popover>
                <PopoverTrigger>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'flex h-11 w-full items-center justify-between px-4 py-2 pl-3 text-right font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      {field.value ? formatArabicDate(new Date(field.value)) : <span>اختر التاريخ</span>}
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
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
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
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>السبب</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="اكتب سبب الزيادة..." {...field} />
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
