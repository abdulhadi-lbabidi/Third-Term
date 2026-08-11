import { useEffect } from 'react';
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
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import { projectsApi } from '@/features/projects/projects.api';
import { usersApi } from '@/features/users/api/users.api';

const genericFundSchema = z.object({
  name: z.string().min(1, 'اسم الصندوق مطلوب'),
  project_id: z.number().optional(),
  user_id: z.number().optional(),
  type: z.enum(['company', 'project', 'user']).optional(),
  is_locked: z.boolean(),
  status: z.enum(['pending', 'complete', 'cancelled']),
  description: z.string().optional(),
  threshold: z.coerce.number().min(0, 'يجب أن يكون الحد الأدنى 0 أو أكثر'),
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

type GenericFundFormValues = z.infer<typeof genericFundSchema>;

type GenericFundFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    id?: number;
    name: string;
    project_id?: number;
    user_id?: number;
    is_locked?: boolean | number;
    status?: 'pending' | 'complete' | 'cancelled';
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

  const form = useForm<any>({
    resolver: zodResolver(genericFundSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      project_id: defaultValues?.project_id || 0,
      user_id: defaultValues?.user_id || 0,
      type: fundType,
      is_locked: defaultValues?.is_locked === true || defaultValues?.is_locked === 1 || false,
      status: defaultValues?.status || 'pending',
      description: defaultValues?.description || '',
      threshold: defaultValues?.threshold ? Number(defaultValues.threshold) : 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: defaultValues?.name || '',
        project_id: defaultValues?.project_id || 0,
        user_id: defaultValues?.user_id || 0,
        type: fundType,
        is_locked: defaultValues?.is_locked === true || defaultValues?.is_locked === 1 || false,
        status: defaultValues?.status || 'pending',
        description: defaultValues?.description || '',
        threshold: defaultValues?.threshold ? Number(defaultValues.threshold) : 0,
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

  const handleSubmit = async (values: GenericFundFormValues) => {
    // Clean up payload based on type
    const payload: any = {
      name: values.name,
      is_locked: values.is_locked,
      status: values.status,
      description: values.description,
      threshold: values.threshold,
    };
    if (fundType === 'project') payload.project_id = values.project_id;
    if (fundType === 'user') payload.user_id = values.user_id;

    await onSubmit(payload);
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
                        variant={field.value === 'cancelled' ? 'default' : 'outline'}
                        className={field.value === 'cancelled' ? 'bg-rose-600 text-white hover:bg-rose-700 border border-rose-600 shadow-sm shadow-rose-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'}
                        onClick={() => field.onChange('cancelled')}
                      >
                        ملغى
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_locked"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>قفل الصندوق</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

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
