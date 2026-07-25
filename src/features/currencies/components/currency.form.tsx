import { useForm } from 'react-hook-form';
import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
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
import type { CreateCurrencyPayload, Currency } from '../types';

const currencySchema = z.object({
  currency: z.string().min(1, 'Currency name is required'),
  symbol: z.string().min(1, 'Symbol is required'),
});

type CurrencyFormProps = {
  defaultValues?: Partial<Currency>;
  onSubmit: (data: CreateCurrencyPayload) => Promise<void>;
  loading?: boolean;
};

export function CurrencyForm({ defaultValues, onSubmit, loading }: CurrencyFormProps) {
  const form = useForm<z.input<typeof currencySchema>, any, z.infer<typeof currencySchema>>({
    resolver: zodResolver(currencySchema),
    defaultValues: {
      currency: defaultValues?.currency || '',
      symbol: defaultValues?.symbol || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(async (data) => {
        try {
          await onSubmit(data);
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 422) {
            const errors = error.response.data.errors;
            if (errors) {
              Object.keys(errors).forEach((key) => {
                form.setError(key as any, {
                  type: 'server',
                  message: errors[key][0],
                });
              });
            }
          }
        }
      })} className="space-y-4">
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم العملة</FormLabel>
              <FormControl>
                <Input placeholder="مثل: الدولار الأمريكي" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الرمز</FormLabel>
              <FormControl>
                <Input placeholder="مثل: USD" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
        </div>
      </form>
    </Form>
  );
}
