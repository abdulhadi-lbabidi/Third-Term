import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Clock, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';

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

const statusOptions: { value: ProjectStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'pending', label: 'قيد الانتظار', icon: Clock, color: 'text-muted-foreground' },
  { value: 'in_progress', label: 'قيد التنفيذ', icon: PlayCircle, color: 'text-blue-500' },
  { value: 'completed', label: 'مكتمل', icon: CheckCircle2, color: 'text-emerald-500' },
  { value: 'cancelled', label: 'ملغى', icon: XCircle, color: 'text-red-500' },
];

export function ProjectsForm({ defaultValues, departments, onSubmit, loading }: ProjectsFormProps) {

  const clientsQuery = useQuery({
    queryKey: ['clients'] as const,
    queryFn: async () => {
      const res = await usersApi.getUsersByRole('client');
      return (res as any)?.data ?? res;
    },
  });
  const clients: ClientRecord[] = clientsQuery.data ?? [];

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
              <FormControl>
                <SearchableSelect
                  value={field.value || null}
                  onValueChange={(val) => field.onChange(Number(val))}
                  options={(clients ?? []).map((c) => ({ value: c.id, label: c.user.name }))}
                  placeholder="اختر العميل"
                  searchPlaceholder="ابحث عن العميل..."
                  emptyMessage="لم يتم العثور على عملاء."
                />
              </FormControl>
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
                  step="1"
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
                      {field.value && (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const selected = statusOptions.find((o) => o.value === field.value);
                            if (!selected) return null;
                            const Icon = selected.icon;
                            return (
                              <>
                                <Icon className={`size-4 ${selected.color}`} />
                                <span>{selected.label}</span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`size-4 ${opt.color}`} />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
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
