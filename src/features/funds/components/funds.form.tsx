import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import type { CreateFundPayload, Fund } from '../types';

type FundsFormValues = CreateFundPayload;

type FundsFormProps = {
  defaultValues?: Fund | null;
  userId?: number;
  onSubmit: (data: FundsFormValues) => Promise<void>;
  loading?: boolean;
};

export function FundsForm({ defaultValues, userId, onSubmit, loading }: FundsFormProps) {
  const form = useForm<FundsFormValues>({
    defaultValues: {
      user_id: userId ?? defaultValues?.user?.id ?? 0,
      name: defaultValues?.name ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      user_id: userId ?? defaultValues?.user?.id ?? 0,
      name: defaultValues?.name ?? '',
    });
  }, [defaultValues, form, userId]);

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
          rules={{ required: true }}
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
