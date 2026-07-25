import { useForm } from 'react-hook-form';
import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import type { CreateDepartmentPayload, Department } from '../types';
const departmentSchema = z.object({
  name: z.string().min(1, 'اسم القسم مطلوب'),
  main_manager: z.string().min(1, 'اسم المدير مطلوب'),
});

type DepartmentFormProps = {
  defaultValues?: Partial<Department>;
  onSubmit: (data: CreateDepartmentPayload) => Promise<void>;
  loading?: boolean;
};

export function DepartmentForm({ defaultValues, onSubmit, loading }: DepartmentFormProps) {
  const form = useForm<z.input<typeof departmentSchema>, any, z.infer<typeof departmentSchema>>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      main_manager: defaultValues?.main_manager || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(async (data) => {
        try {
          await onSubmit(data);
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 422) {
            const errors = error.response.data.errors;
            if (errors) {
              Object.keys(errors).forEach((key) => {
                form.setError(key as any, {
                  type: 'server',
                  message: errors[key][0],
                });
              });
            }
          }
        }
      })} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم القسم</FormLabel>
              <FormControl>
                <Input placeholder="مثل: قسم الهندسة المدنية" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="main_manager"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المدير الرئيسي</FormLabel>
              <FormControl>
                <Input placeholder="مثل: م.علي" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
