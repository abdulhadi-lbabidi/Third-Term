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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/command';
import type { ProjectTeamMember, CreateProjectTeamPayload } from '../project-team.types';

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
  user_id: z
    .number({ error: 'يجب اختيار مستخدم' })
    .min(1, 'يجب اختيار مستخدم'),
  project_id: z.number().min(1, 'معرف المشروع مطلوب'),
});

type FormValues = z.infer<typeof formSchema>;

type ProjectTeamFormProps = {
  projectId: number;
  member?: ProjectTeamMember | null;
  users: UserOption[];
  onSubmit: (data: CreateProjectTeamPayload) => Promise<void>;
  loading?: boolean;
};

export function ProjectTeamForm({ projectId, member, users, onSubmit, loading }: ProjectTeamFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: member?.name ?? '',
      user_id: member?.user?.id ?? 0,
      project_id: projectId,
    },
  });

  useEffect(() => {
    form.reset({
      name: member?.name ?? '',
      user_id: member?.user?.id ?? 0,
      project_id: projectId,
    });
  }, [form, member, projectId]);

  const handleSubmit = async (values: FormValues) => {
    await onSubmit({
      name: values.name,
      user_id: values.user_id,
      project_id: values.project_id,
    });
  };

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

        {/* User — Combobox (base-ui) */}
        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => {
            const selectedName = users.find((u) => u.id === field.value)?.name ?? '';
            return (
              <FormItem className="flex flex-col space-y-2">
                <FormLabel>عضو الفريق</FormLabel>
                <Combobox
                  value={selectedName}
                  onValueChange={(val) => {
                    const matched = users.find((u) => u.name === val);
                    if (matched) field.onChange(matched.id);
                  }}
                >
                  <FormControl>
                    <ComboboxInput
                      placeholder="ابحث عن عضو الفريق..."
                      className="w-full h-10"
                    />
                  </FormControl>
                  <ComboboxContent>
                    <ComboboxList>
                      <ComboboxEmpty>لم يتم العثور على مستخدمين.</ComboboxEmpty>
                      {users.map((user) => (
                        <ComboboxItem key={user.id} value={user.name}>
                          {user.name}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'جاري الحفظ...' : member ? 'حفظ التعديلات' : 'إضافة عضو'}
        </Button>
      </form>
    </Form>
  );
}
