import { useForm } from 'react-hook-form';
import { isAxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
              <FormLabel>{t('currencies.form.name', 'Currency Name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('currencies.form.namePlaceholder', 'e.g. US Dollar')} {...field} />
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
              <FormLabel>{t('currencies.form.symbol', 'Symbol')}</FormLabel>
              <FormControl>
                <Input placeholder={t('currencies.form.symbolPlaceholder', 'e.g. USD')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? t('currencies.form.saving', 'Saving...') : t('currencies.form.save', 'Save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
