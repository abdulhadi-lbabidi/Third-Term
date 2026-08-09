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
import { Calendar as CalendarIcon, CheckCircle2, Clock, PlayCircle, XCircle } from 'lucide-react';
import { cn, formatArabicDate } from '@/shared/lib/utils';
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

const statusOptions = [
  { value: 'pending', label: 'قيد الانتظار', icon: Clock, color: 'text-muted-foreground' },
  { value: 'in_progress', label: 'قيد التنفيذ', icon: PlayCircle, color: 'text-info' },
  { value: 'completed', label: 'مكتمل', icon: CheckCircle2, color: 'text-success' },
  { value: 'cancelled', label: 'ملغى', icon: XCircle, color: 'text-destructive' },
] as const;

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
                <FormLabel>تاريخ الانتهاء المتوقع</FormLabel>
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
              const selectedStatus = statusOptions.find((option) => option.value === field.value);
              return (
              <FormItem>
                <FormLabel>حالة المرحلة</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="اختر الحالة">
                        {selectedStatus && (
                          <span className="flex items-center gap-2">
                            <selectedStatus.icon className={`size-4 ${selectedStatus.color}`} />
                            {selectedStatus.label}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <option.icon className={`size-4 ${option.color}`} />
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}}
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'جاري الحفظ...' : stage ? 'حفظ التعديلات' : 'إضافة مرحلة'}
        </Button>
      </form>
    </Form>
  );
}
