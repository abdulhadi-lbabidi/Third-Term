import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { itemsApi } from '@/features/items/items.api';
import type { Item } from '@/features/items/types';
import type { Material } from '../types';
import { materialFormSchema, type MaterialFormValues } from '../schemas/materials.schema';

type MaterialFormProps = {
  defaultValues?: Material | null;
  onSubmit: (data: MaterialFormValues) => Promise<void>;
  loading?: boolean;
};

function getMaterialItemId(material?: Material | null) {
  return material?.item_id ?? material?.item?.id ?? 0;
}

export function MaterialForm({ defaultValues, onSubmit, loading }: MaterialFormProps) {
  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ['materials', 'items'] as const,
    queryFn: () => itemsApi.getItems(),
  });

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      item_id: getMaterialItemId(defaultValues),
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      item_id: getMaterialItemId(defaultValues),
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
    });
  }, [defaultValues, form]);

  const itemOptions =
    defaultValues?.item && !items.some((item) => item.id === defaultValues.item?.id)
      ? [defaultValues.item, ...items]
      : items;

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
          name="item_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البند</FormLabel>
              <FormControl>
                <select
                  value={field.value ? String(field.value) : ''}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                  className="field-control"
                >
                  <option value="" disabled>
                    اختر البند
                  </option>
                  {itemOptions.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم المادة</FormLabel>
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </form>
    </Form>
  );
}
