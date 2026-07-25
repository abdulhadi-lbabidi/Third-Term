import { useEffect } from 'react';
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
import type { CreateProjectPayload, Project, ProjectStatus } from '../types';
import type { ClientRecord } from '@/features/users/types';

type ProjectsFormValues = CreateProjectPayload;

type ProjectsFormProps = {
  defaultValues?: Project | null;
  clients: ClientRecord[];
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

export function ProjectsForm({ defaultValues, clients, departments, onSubmit, loading }: ProjectsFormProps) {

  const form = useForm<ProjectsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      department_id: departments[0]?.id ?? 0,
      client_id: defaultValues?.client?.id ?? clients[0]?.id ?? 0,
      name: defaultValues?.name ?? '',
      expected_cost: defaultValues?.expected_cost ?? 0,
      status: defaultValues?.status ?? 'pending',
    },
  });

  useEffect(() => {
    form.reset({
      department_id: departments[0]?.id ?? 0,
      client_id: defaultValues?.client?.id ?? clients[0]?.id ?? 0,
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
        <FormField
          control={form.control}
          name="department_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>القسم</FormLabel>
              <Select
                value={field.value ? field.value.toString() : ""}
                onValueChange={(val) => field.onChange(Number(val))}
              >
                <FormControl>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
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
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>العميل</FormLabel>
              <Select
                value={field.value ? field.value.toString() : ""}
                onValueChange={(val) => field.onChange(Number(val))}
              >
                <FormControl>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.user.name}
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

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الحالة</FormLabel>
              <Select
                value={field.value}
                onValueChange={(val) => field.onChange(val as ProjectStatus)}
              >
                <FormControl>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
