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
import { projectsApi } from '@/features/projects/projects.api';
import { usersApi } from '@/features/users/api/users.api';

const genericFundSchema = z.object({
  name: z.string().min(1, 'اسم الصندوق مطلوب'),
  project_id: z.number().optional(),
  user_id: z.number().optional(),
  type: z.enum(['company', 'project', 'user']).optional(),
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

type GenericFundFormValues = {
  name: string;
  project_id?: number;
  user_id?: number;
  type?: 'company' | 'project' | 'user';
};

type GenericFundFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    id?: number;
    name: string;
    project_id?: number;
    user_id?: number;
  } | null;
  fundType: 'company' | 'project' | 'user';
  onSubmit: (values: GenericFundFormValues) => Promise<void>;
  loading?: boolean;
};

export function GenericFundDialog({
  open,
  onOpenChange,
  defaultValues,
  fundType,
  onSubmit,
  loading,
}: GenericFundFormProps) {
  const isEditing = !!defaultValues?.id;

  const form = useForm<GenericFundFormValues>({
    resolver: zodResolver(genericFundSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      project_id: defaultValues?.project_id || 0,
      user_id: defaultValues?.user_id || 0,
      type: fundType,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: defaultValues?.name || '',
        project_id: defaultValues?.project_id || 0,
        user_id: defaultValues?.user_id || 0,
        type: fundType,
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
    const payload: GenericFundFormValues = { name: values.name };
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

            {fundType === 'project' && !isEditing && (
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

            {fundType === 'user' && !isEditing && (
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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                إلغاء
              </Button>
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
