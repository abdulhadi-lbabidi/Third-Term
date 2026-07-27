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
import type { StageTimeline, CreateStageTimelinePayload } from '../stage-timelines.types';

const formSchema = z.object({
  stage_name: z.string().min(1, 'اسم التحديث التفصيلي مطلوب'),
  start_date: z.string().min(1, 'تاريخ البدء مطلوب'),
  expected_end_date: z.string().min(1, 'تاريخ الانتهاء المتوقع مطلوب'),
  actual_end_date: z.string().optional(),
  status: z.string().min(1, 'حالة التحديث مطلوبة'),
  stage_progress: z.number().min(0).max(100, 'النسبة يجب أن لا تتجاوز 100'),
});

type FormValues = z.infer<typeof formSchema>;

type StageTimelineFormProps = {
  projectStageId: number;
  timeline?: StageTimeline | null;
  onSubmit: (data: CreateStageTimelinePayload) => Promise<void>;
  loading?: boolean;
  onDelete?: () => void;
};

export function StageTimelineForm({
  projectStageId,
  timeline,
  onSubmit,
  loading,
  onDelete,
}: StageTimelineFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stage_name: timeline?.stage_name ?? '',
      start_date: timeline?.start_date ?? new Date().toISOString().split('T')[0],
      expected_end_date: timeline?.expected_end_date ?? '',
      actual_end_date: timeline?.actual_end_date ?? '',
      status: timeline?.status ?? 'pending',
      stage_progress: timeline?.stage_progress ?? 0,
    },
  });

  useEffect(() => {
    form.reset({
      stage_name: timeline?.stage_name ?? '',
      start_date: timeline?.start_date ?? new Date().toISOString().split('T')[0],
      expected_end_date: timeline?.expected_end_date ?? '',
      actual_end_date: timeline?.actual_end_date ?? '',
      status: timeline?.status ?? 'pending',
      stage_progress: timeline?.stage_progress ?? 0,
    });
  }, [form, timeline]);

  const handleSubmit = async (values: FormValues) => {
    await onSubmit({
      ...values,
      actual_end_date: values.actual_end_date || null,
      project_stage_id: projectStageId,
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="stage_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الاسم التفصيلي</FormLabel>
              <FormControl>
                <Input placeholder="مثال: الأسبوع الأول - اختبار الأداء" {...field} />
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
                <FormLabel>الانتهاء المتوقع</FormLabel>
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
                <FormLabel>الحالة</FormLabel>
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

        <FormField
          control={form.control}
          name="actual_end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تاريخ الانتهاء الفعلي (اختياري)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'جاري الحفظ...' : timeline ? 'حفظ التعديلات' : 'إضافة التفصيل الزمني'}
          </Button>
          {timeline && onDelete && (
            <Button
              type="button"
              variant="destructive"
              className="shrink-0"
              onClick={onDelete}
              disabled={loading}
            >
              حذف
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
