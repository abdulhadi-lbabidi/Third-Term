import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import type { Project } from '../types';
import type { ProjectFund } from '../project-funds.types';
import { projectFundFormSchema, type ProjectFundFormValues } from '../schemas/projects.schema';

type ProjectFundsFormProps = {
  project?: Project | null;
  projectFund?: ProjectFund | null;
  onSubmit: (data: ProjectFundFormValues) => Promise<void>;
  loading?: boolean;
};

export function ProjectFundsForm({ project, projectFund, onSubmit, loading }: ProjectFundsFormProps) {
  const form = useForm<ProjectFundFormValues, undefined, ProjectFundFormValues>({
    resolver: zodResolver(projectFundFormSchema),
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
