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
import type { Project, ProjectFund } from '../../types';
import type { ProjectFundFormValues } from '../../schemas/projects.schema';

type ProjectFundsFormProps = {
  project?: Project | null;
  projectFund?: ProjectFund | null;
  onSubmit: (data: ProjectFundFormValues) => Promise<void>;
  loading?: boolean;
};

// ───────────────────────────────────────────────
// Zod schema
// ───────────────────────────────────────────────
const formSchema = z.object({
  project_id: z.number().min(1, 'معرف المشروع مطلوب'),
  name: z.string().min(1, 'اسم الصندوق مطلوب'),
});

type FormValues = z.infer<typeof formSchema>;

export function ProjectFundsForm({ project, projectFund, onSubmit, loading }: ProjectFundsFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_id: project?.id ?? 0,
      name: projectFund?.name ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      project_id: project?.id ?? 0,
      name: projectFund?.name ?? '',
    });
  }, [form, project, projectFund]);

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        {/* Fund Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم الصندوق</FormLabel>
              <FormControl>
                <Input placeholder="مثال: صندوق المصروفات النثرية" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'جاري الحفظ...' : projectFund ? 'حفظ التعديلات' : 'إضافة صندوق'}
        </Button>
      </form>
    </Form>
  );
}
