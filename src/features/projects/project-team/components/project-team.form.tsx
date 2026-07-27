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
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import type { ProjectTeamMember } from '../project-team.types';

// ───────────────────────────────────────────────
// Exported user option shape (used by parent/dialog)
// ───────────────────────────────────────────────
export type UserOption = {
  id: number;
  name: string;
};

// ───────────────────────────────────────────────
// Zod schema
// ───────────────────────────────────────────────
const formSchema = z.object({
  name: z.string().min(1, 'اسم الدور مطلوب'),
  user_ids: z
    .array(z.number())
    .min(1, 'يجب اختيار مستخدم واحد على الأقل'),
  project_id: z.number().min(1, 'معرف المشروع مطلوب'),
});

type FormValues = z.infer<typeof formSchema>;

type ProjectTeamFormProps = {
  projectId: number;
  member?: ProjectTeamMember | null;
  users: UserOption[];
  onSubmit: (data: { name: string; user_ids: number[]; project_id: number; }) => Promise<void>;
  loading?: boolean;
};

export function ProjectTeamForm({ projectId, member, users, onSubmit, loading }: ProjectTeamFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: member?.name ?? '',
      user_ids: member?.user?.id ? [member.user.id] : [],
      project_id: projectId,
    },
  });

  useEffect(() => {
    form.reset({
      name: member?.name ?? '',
      user_ids: member?.user?.id ? [member.user.id] : [],
      project_id: projectId,
    });
  }, [form, member, projectId]);

  const handleSubmit = async (values: FormValues) => {
    await onSubmit({
      name: values.name,
      user_ids: values.user_ids,
      project_id: values.project_id,
    });
  };

  // Map users to SearchableSelect option shape
  const userOptions = users.map((u) => ({ value: u.id, label: u.name }));

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>

        {/* Role / title */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم الدور / المنصب</FormLabel>
              <FormControl>
                <Input placeholder="مثال: مهندس موقع أول" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* User — SearchableSelect */}
        <FormField
          control={form.control}
          name="user_ids"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-2">
              <FormLabel>{member ? 'عضو الفريق' : 'أعضاء الفريق'}</FormLabel>
              <FormControl>
                <SearchableSelect
                  multiple={!member}
                  value={!member ? field.value : (field.value[0] || null)}
                  onValueChange={(val) => {
                    if (!member) {
                      field.onChange(val);
                    } else {
                      field.onChange([val]);
                    }
                  }}
                  options={userOptions}
                  placeholder="اختر عضو الفريق..."
                  searchPlaceholder="ابحث عن عضو الفريق..."
                  emptyMessage="لم يتم العثور على مستخدمين."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'جاري الحفظ...' : member ? 'حفظ التعديلات' : 'إضافة عضو'}
        </Button>
      </form>
    </Form>
  );
}
