import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

import type { CreateProjectPayload, Project, ProjectStatus } from '../types';
import type { ClientRecord } from '@/features/users/types';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/features/users/api/users.api';

type ProjectsFormValues = CreateProjectPayload;

type ProjectsFormProps = {
  defaultValues?: Project | null;
  departments: { id: number; name: string }[];
  onSubmit: (data: ProjectsFormValues) => Promise<void>;
  loading?: boolean;
};

const formSchema = z.object({
  department_id: z.number().min(1, 'الرجاء اختيار القسم'),
  client_id: z.number().min(1, 'الرجاء اختيار العميل'),
  name: z.string().min(1, 'اسم المشروع مطلوب'),
  expected_cost: z.number().min(0, 'التكلفة يجب أن تكون أكبر من أو تساوي صفر'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled'] as const),
});

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغى' },
];

export function ProjectsForm({ defaultValues, departments, onSubmit, loading }: ProjectsFormProps) {
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const { data: clients } = useQuery<ClientRecord[]>(
    { queryKey: ['clients'] as const, queryFn: () => usersApi.getUsersByRole('client') as Promise<ClientRecord[]> }
  );

  const form = useForm<ProjectsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      department_id: departments[0]?.id ?? 0,
      client_id: defaultValues?.client?.id ?? clients?.[0]?.id ?? 0,
      name: defaultValues?.name ?? '',
      expected_cost: defaultValues?.expected_cost ?? 0,
      status: defaultValues?.status ?? 'pending',
    },
  });

  useEffect(() => {
    form.reset({
      department_id: departments[0]?.id ?? 0,
      client_id: defaultValues?.client?.id ?? clients?.[0]?.id ?? 0,
      name: defaultValues?.name ?? '',
      expected_cost: defaultValues?.expected_cost ?? 0,
      status: defaultValues?.status ?? 'pending',
    });
  }, [clients, departments, defaultValues, form]);

  const filteredClients = clients?.filter((c) =>
    c.user.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        {/* Department */}
        <FormField
          control={form.control}
          name="department_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>القسم</FormLabel>
              <Select
                value={field.value ? String(field.value) : ''}
                onValueChange={(val) => field.onChange(Number(val))}
              >
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="اختر القسم">
                      {field.value
                        ? departments.find((d) => d.id === field.value)?.name
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Client */}
        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2">
              <FormLabel>العميل</FormLabel>
              <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                <PopoverTrigger>
                  <FormControl>
                    <Button
                      variant="outline"
                      type="button"
                      className={cn(
                        'w-full justify-between h-10 font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value
                        ? clients?.find((c) => c.id === field.value)?.user?.name
                        : 'اختر العميل'}
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0"
                  align="start"
                  style={{ width: 'var(--radix-popover-trigger-width)' }}
                >
                  <div className="p-2 border-b">
                    <input
                      className="w-full text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                      placeholder="ابحث عن العميل..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
                    {filteredClients?.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        لم يتم العثور على عملاء.
                      </p>
                    )}
                    {filteredClients?.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors',
                          client.id === field.value && 'bg-accent text-accent-foreground'
                        )}
                        onClick={() => {
                          field.onChange(client.id);
                          setClientPopoverOpen(false);
                          setClientSearch('');
                        }}
                      >
                        <Check
                          className={cn(
                            'h-4 w-4 shrink-0',
                            client.id === field.value ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {client.user.name}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Project Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم المشروع</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Expected Cost */}
        <FormField
          control={form.control}
          name="expected_cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>التكلفة المتوقعة</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  value={field.value}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الحالة</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="اختر الحالة">
                      {field.value
                        ? statusOptions.find((o) => o.value === field.value)?.label
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
