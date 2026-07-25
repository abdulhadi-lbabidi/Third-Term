import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';

import type { CreateItemPayload, Item } from '../types';
import { Textarea } from '@/components/ui/textarea';

type ItemsFormValues = CreateItemPayload;

type ItemsFormProps = {
  defaultValues?: Item | null;
  onSubmit: (data: ItemsFormValues) => Promise<void>;
  loading?: boolean;
};

export function ItemsForm({ defaultValues, onSubmit, loading }: ItemsFormProps) {
  const form = useForm<ItemsFormValues>({
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
    });
  }, [defaultValues, form]);

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
              <FormLabel>اسم البند</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>الوصف</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
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
