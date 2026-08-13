import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button, buttonVariants } from '@/shared/components/ui/button';
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
import { Slider } from '@/shared/components/ui/slider';
import { Calendar } from '@/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn, formatArabicDate } from '@/shared/lib/utils';
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col mt-2.5">
                <FormLabel>تاريخ البدء</FormLabel>
                <Popover>
                  <FormControl>
                    <PopoverTrigger
                      className={buttonVariants({
                        variant: 'outline',
                        className: cn(
                          'w-full pl-3 text-right font-normal h-10 px-4 py-2 flex justify-between items-center',
                          !field.value && 'text-muted-foreground'
                        )
                      })}
                    >
                      {field.value ? (
                        formatArabicDate(new Date(field.value))
                      ) : (
                        <span>اختر تاريخ</span>
                      )}
                      <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                    </PopoverTrigger>
                  </FormControl>
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
            name="expected_end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col mt-2.5">
                <FormLabel>الانتهاء المتوقع</FormLabel>
                <Popover>
                  <FormControl>
                    <PopoverTrigger
                      className={buttonVariants({
                        variant: 'outline',
                        className: cn(
                          'w-full pl-3 text-right font-normal h-10 px-4 py-2 flex justify-between items-center',
                          !field.value && 'text-muted-foreground'
                        )
                      })}
                    >
                      {field.value ? (
                        formatArabicDate(new Date(field.value))
                      ) : (
                        <span>اختر تاريخ</span>
                      )}
                      <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                    </PopoverTrigger>
                  </FormControl>
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => {
              const statusLabels: Record<string, string> = {
                pending: 'مقترح',
                in_progress: 'قيد التنفيذ',
                completed: 'منتهي',
                canceled: 'متوقف',
              };
              return (
                <FormItem>
                  <FormLabel>الحالة</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="اختر الحالة">
                          {field.value ? statusLabels[field.value] : null}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">مقترح</SelectItem>
                      <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                      <SelectItem value="completed">منتهي</SelectItem>
                      <SelectItem value="canceled">متوقف</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <FormField
            control={form.control}
            name="stage_progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نسبة الإنجاز ({field.value}%)</FormLabel>
                <FormControl>
                  <div className="pt-3">
                    <Slider
                      defaultValue={[field.value]}
                      value={[field.value]}
                      max={100}
                      step={1}
                      onValueChange={(val) => field.onChange(Array.isArray(val) ? val[0] : val)}
                    />
                  </div>
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
            <FormItem className="flex flex-col mt-2.5">
              <FormLabel>تاريخ الانتهاء الفعلي (اختياري)</FormLabel>
              <Popover>
                <FormControl>
                  <PopoverTrigger
                    className={buttonVariants({
                      variant: 'outline',
                      className: cn(
                        'w-full pl-3 text-right font-normal h-10 px-4 py-2 flex justify-between items-center',
                        !field.value && 'text-muted-foreground'
                      )
                    })}
                  >
                    {field.value ? (
                      formatArabicDate(new Date(field.value))
                    ) : (
                      <span>اختر تاريخ</span>
                    )}
                    <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                  </PopoverTrigger>
                </FormControl>
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

        <div className="flex gap-3 pt-2">
          <button type="submit" className={buttonVariants({ className: "flex-1" })} disabled={loading}>
            {loading ? 'جاري الحفظ...' : timeline ? 'حفظ التعديلات' : 'إضافة التفصيل الزمني'}
          </button>
          {/* {timeline && onDelete && ( */}
          <Button
            type="button"
            className={buttonVariants({ variant: 'destructive', className: 'shrink-0' })}
            onClick={onDelete}
            disabled={loading}
          >
            حذف
          </Button>
          {/* )} */}
        </div>
      </form>
    </Form>
  );
}
