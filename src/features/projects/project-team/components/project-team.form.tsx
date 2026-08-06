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
import type { ProjectTeamMember } from '../project-team.types';
import { InlineSearchableSelect } from '@/shared/components/ui/inline-searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

// ───────────────────────────────────────────────
// Exported user option shape (used by parent/dialog)
// ───────────────────────────────────────────────
export type UserOption = {
  id: number;
  name: string;
  type: 'employee' | 'engineer';
};

// ───────────────────────────────────────────────
// Zod schema
// ───────────────────────────────────────────────
const formSchema = z.object({
  member_type: z.enum(['employee', 'engineer']),
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
      member_type: users.find((user) => user.id === member?.user?.id)?.type ?? 'employee',
      name: member?.name ?? '',
      user_ids: member?.user?.id ? [member.user.id] : [],
      project_id: projectId,
    },
  });

  useEffect(() => {
    form.reset({
      member_type: users.find((user) => user.id === member?.user?.id)?.type ?? 'employee',
      name: member?.name ?? '',
      user_ids: member?.user?.id ? [member.user.id] : [],
      project_id: projectId,
    });
  }, [form, member, projectId, users]);

  const handleSubmit = async (values: FormValues) => {
    await onSubmit({
      name: values.name,
      user_ids: values.user_ids,
      project_id: values.project_id,
    });
  };

  // Map users to SearchableSelect option shape
  const memberType = form.watch('member_type');
  const userOptions = users
    .filter((user) => user.type === memberType)
    .map((user) => ({ value: user.id, label: user.name }));

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>

        <FormField
          control={form.control}
          name="member_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نوع عضو المشروع</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  if (!value) return;
                  field.onChange(value);
                  form.setValue('user_ids', []);
                  form.clearErrors('user_ids');
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع العضو">
                      {field.value === 'engineer' ? 'مهندس' : 'موظف'}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="employee">موظف</SelectItem>
                  <SelectItem value="engineer">مهندس</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
              <FormLabel>{member ? (memberType === 'engineer' ? 'المهندس' : 'الموظف') : (memberType === 'engineer' ? 'المهندسون' : 'الموظفون')}</FormLabel>
              <FormControl>
                <InlineSearchableSelect
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
                  // placeholder="اختر عضو الفريق..."
                  searchPlaceholder={memberType === 'engineer' ? 'ابحث عن مهندس...' : 'ابحث عن موظف...'}
                  emptyMessage={memberType === 'engineer' ? 'لم يتم العثور على مهندسين.' : 'لم يتم العثور على موظفين.'}
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
