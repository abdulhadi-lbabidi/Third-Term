import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Textarea } from '@/shared/components/ui/textarea';
import { projectsApi } from '@/features/projects/projects.api';
import { usersApi } from '@/features/users/api/users.api';

const genericFundSchema = z.object({
  name: z.string().min(1, 'اسم الصندوق مطلوب'),
  project_id: z.number().optional(),
  user_id: z.number().optional(),
  type: z.enum(['company', 'project', 'user']).optional(),
  status: z.enum(['pending', 'complete', 'canceled']).optional(),
  description: z.string().min(1, 'الوصف مطلوب'),
  threshold: z.string()
    .min(1, 'الحد الأدنى لرصيد الصندوق مطلوب')
    .refine((val) => !isNaN(Number(val)), 'يجب إدخال رقم صحيح')
    .transform((val) => Number(val))
    .refine((val) => val >= 0, 'يجب أن يكون الحد الأدنى 0 أو أكثر'),
}).superRefine((val, ctx) => {
  if (val.type === 'project' && !val.project_id) {
    ctx.addIssue({
      code: 'custom',
      path: ['project_id'],
      message: 'الرجاء اختيار المشروع',
    });
  }
  if (val.type === 'user' && !val.user_id) {
    ctx.addIssue({
      code: 'custom',
      path: ['user_id'],
      message: 'الرجاء اختيار المستخدم',
    });
  }
});



type GenericFundFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    id?: number;
    name: string;
    project_id?: number;
    user_id?: number;
    status?: 'pending' | 'complete' | 'canceled';
    description?: string;
    threshold?: number | string;
  } | null;
  fundType: 'company' | 'project' | 'user';
  onSubmit: (values: any) => Promise<void>;
  loading?: boolean;
  hideProjectSelection?: boolean;
  hideUserSelection?: boolean;
};

export function GenericFundDialog({
  open,
  onOpenChange,
  defaultValues,
  fundType,
  onSubmit,
  loading,
  hideProjectSelection,
  hideUserSelection,
}: GenericFundFormProps) {
  const isEditing = !!defaultValues?.id;
  const [, setSearchParams] = useSearchParams();

  const form = useForm<any>({
    resolver: zodResolver(genericFundSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      project_id: defaultValues?.project_id || 0,
      user_id: defaultValues?.user_id || 0,
      type: fundType,
      status: defaultValues?.status || 'pending',
      description: defaultValues?.description || '',
      threshold: defaultValues?.threshold !== undefined && defaultValues?.threshold !== null ? String(defaultValues.threshold) : '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: defaultValues?.name || '',
        project_id: defaultValues?.project_id || 0,
        user_id: defaultValues?.user_id || 0,
        type: fundType,
        status: defaultValues?.status || 'pending',
        description: defaultValues?.description || '',
        threshold: defaultValues?.threshold !== undefined && defaultValues?.threshold !== null ? String(defaultValues.threshold) : '',
      });
    }
  }, [open, defaultValues, form, fundType]);

  const projectsQuery = useQuery({
    queryKey: ['projects'] as const,
    queryFn: () => projectsApi.getProjects(),
    enabled: open && fundType === 'project',
  });
  const projects = projectsQuery.data?.data ?? [];

  const usersQuery = useQuery({
    queryKey: ['users'] as const,
    queryFn: () => usersApi.getUsers(),
    enabled: open && fundType === 'user',
  });
  const users = usersQuery.data ?? [];

  const handleSubmit = async (values: any) => {
    const payload: any = {
      name: values.name,
      description: values.description,
      threshold: values.threshold,
    };
    if (isEditing) {
      payload.status = values.status;
    }
    if (fundType === 'project') payload.project_id = values.project_id;
    if (fundType === 'user') payload.user_id = values.user_id;

    await onSubmit(payload);

    if (isEditing && (values.status === 'complete' || values.status === 'canceled')) {
      setSearchParams((prev) => {
        prev.delete('fundId');
        return prev;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'تعديل الصندوق' : 'إضافة صندوق جديد'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الصندوق</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسم الصندوق" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="threshold"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>الحد الأدنى لرصيد الصندوق</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {fundType === 'project' && !isEditing && !hideProjectSelection && (
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المشروع</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(val) => field.onChange(val ? Number(val) : 0)}
                        options={projects.map((p) => ({
                          value: String(p.id),
                          label: p.name,
                        }))}
                        placeholder="اختر المشروع"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {fundType === 'user' && !isEditing && !hideUserSelection && (
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المستخدم</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value ? String(field.value) : ''}
                        onValueChange={(val) => field.onChange(val ? Number(val) : 0)}
                        options={users.map((u) => ({
                          value: String(u.id),
                          label: u.name ?? u.user?.name ?? '',
                        }))}
                        placeholder="اختر المستخدم"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>حالة الصندوق</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant={field.value === 'pending' ? 'default' : 'outline'}
                          className={field.value === 'pending' ? 'bg-amber-500 text-white hover:bg-amber-600 border border-amber-500 shadow-sm shadow-amber-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'}
                          onClick={() => field.onChange('pending')}
                        >
                          قيد الانتظار
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === 'complete' ? 'default' : 'outline'}
                          className={field.value === 'complete' ? 'bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 shadow-sm shadow-emerald-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'}
                          onClick={() => field.onChange('complete')}
                        >
                          مكتمل
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === 'canceled' ? 'default' : 'outline'}
                          className={field.value === 'canceled' ? 'bg-rose-600 text-white hover:bg-rose-700 border border-rose-600 shadow-sm shadow-rose-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'}
                          onClick={() => field.onChange('canceled')}
                        >
                          منتهي
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="أدخل وصف الصندوق..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
