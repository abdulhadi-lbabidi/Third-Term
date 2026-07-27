import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type { ProjectStage, CreateProjectStagePayload } from '../project-stages.types';

const formSchema = z.object({
  name: z.string().min(1, 'اسم المرحلة مطلوب'),
  start_date: z.string().min(1, 'تاريخ البدء مطلوب'),
  expected_end_date: z.string().min(1, 'تاريخ الانتهاء المتوقع مطلوب'),
  status: z.string().min(1, 'حالة المرحلة مطلوبة'),
  stage_progress: z.number().min(0).max(100, 'النسبة يجب أن لا تتجاوز 100'),
});

type FormValues = z.infer<typeof formSchema>;

type ProjectStagesFormProps = {
  projectId: number;
  stage?: ProjectStage | null;
  onSubmit: (data: CreateProjectStagePayload) => Promise<void>;
  loading?: boolean;
};

export function ProjectStagesForm({ projectId, stage, onSubmit, loading }: ProjectStagesFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: stage?.name ?? '',
      start_date: stage?.start_date ?? new Date().toISOString().split('T')[0],
      expected_end_date: stage?.expected_end_date ?? '',
      status: stage?.status ?? 'pending',
      stage_progress: stage?.stage_progress ?? 0,
    },
  });

  useEffect(() => {
    form.reset({
      name: stage?.name ?? '',
      start_date: stage?.start_date ?? new Date().toISOString().split('T')[0],
      expected_end_date: stage?.expected_end_date ?? '',
      status: stage?.status ?? 'pending',
      stage_progress: stage?.stage_progress ?? 0,
    });
  }, [form, stage]);

  const handleSubmit = async (values: FormValues) => {
    await onSubmit({
      ...values,
      project_id: projectId,
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم المرحلة</FormLabel>
              <FormControl>
                <Input placeholder="مثال: تحليل المتطلبات" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ البدء</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expected_end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تاريخ الانتهاء المتوقع</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>حالة المرحلة</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغى</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stage_progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نسبة الإنجاز (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'جاري الحفظ...' : stage ? 'حفظ التعديلات' : 'إضافة مرحلة'}
        </Button>
      </form>
    </Form>
  );
}
