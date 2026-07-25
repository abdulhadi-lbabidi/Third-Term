import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import type { CreateProjectFundPayload, ProjectFund } from '../project-funds/project-funds.types';
import type { Project } from '../types';

type ProjectFundsFormValues = CreateProjectFundPayload;

type ProjectFundsFormProps = {
  project?: Project | null;
  projectFund?: ProjectFund | null;
  onSubmit: (data: ProjectFundsFormValues) => Promise<void>;
  loading?: boolean;
};

const formSchema = z.object({
  project_id: z.number().min(1, 'معرف المشروع مطلوب'),
  name: z.string().min(1, 'اسم الصندوق مطلوب'),
});

export function ProjectFundsForm({ project, projectFund, onSubmit, loading }: ProjectFundsFormProps) {
  const form = useForm<ProjectFundsFormValues>({
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم الصندوق</FormLabel>
              <FormControl>
                <Input {...field} />
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
