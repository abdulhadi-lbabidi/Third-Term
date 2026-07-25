import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import type { CreateProjectPayload, Project, ProjectStatus } from '../types';
import type { ClientRecord } from '@/features/users/types';

type ProjectsFormValues = CreateProjectPayload;

type ProjectsFormProps = {
  defaultValues?: Project | null;
  clients: ClientRecord[];
  onSubmit: (data: ProjectsFormValues) => Promise<void>;
  loading?: boolean;
};

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغى' },
];

export function ProjectsForm({ defaultValues, clients, onSubmit, loading }: ProjectsFormProps) {
  const form = useForm<ProjectsFormValues>({
    defaultValues: {
      client_id: defaultValues?.client?.id ?? clients[0]?.id ?? 0,
      name: defaultValues?.name ?? '',
      expected_cost: defaultValues?.expected_cost ?? 0,
      status: defaultValues?.status ?? 'pending',
    },
  });

  useEffect(() => {
    form.reset({
      client_id: defaultValues?.client?.id ?? clients[0]?.id ?? 0,
      name: defaultValues?.name ?? '',
      expected_cost: defaultValues?.expected_cost ?? 0,
      status: defaultValues?.status ?? 'pending',
    });
  }, [clients, defaultValues, form]);

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
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>العميل</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={field.value ? String(field.value) : ''}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                >
                  <option value="" disabled>
                    اختر العميل
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={String(client.id)}>
                      {client.user.name}
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
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value as ProjectStatus)}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
