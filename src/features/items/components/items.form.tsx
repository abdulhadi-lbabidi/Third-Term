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
import { Textarea } from '@/shared/components/ui/textarea';
import type { Item } from '../types';
import { itemFormSchema, type ItemFormValues } from '../schemas/items.schema';

type ItemsFormProps = {
  defaultValues?: Item | null;
  onSubmit: (data: ItemFormValues) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
};

export function ItemsForm({ defaultValues, onSubmit, onCancel, loading }: ItemsFormProps) {
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
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

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              إلغاء
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
