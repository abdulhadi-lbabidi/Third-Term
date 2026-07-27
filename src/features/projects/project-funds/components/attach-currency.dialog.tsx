import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
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
import type { Currency } from '@/features/currencies/types';
import { attachProjectCurrencySchema, type AttachProjectCurrencyValues } from '../../schemas/projects.schema';

type AttachCurrencyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencies: Currency[];
  onSubmit: (values: { currency_id: number; balance: string }) => Promise<void>;
  loading?: boolean;
};

export function AttachCurrencyDialog({
  open,
  onOpenChange,
  currencies,
  onSubmit,
  loading,
}: AttachCurrencyDialogProps) {
  const form = useForm<AttachProjectCurrencyValues>({
    resolver: zodResolver(attachProjectCurrencySchema) as any,
    defaultValues: { currency_id: 0, balance: '' },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ currency_id: 0, balance: '' });
    }
  }, [form, open]);

  const handleSubmit = async (values: AttachProjectCurrencyValues) => {
    await onSubmit({
      currency_id: values.currency_id,
      balance: values.balance,
    });
  };

  const currencyOptions = currencies.map((currency) => ({
    value: currency.id,
    label: `${currency.currency} ${currency.symbol}`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>إرفاق عملة لصندوق المشروع</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Currency */}
            <FormField
              control={form.control}
              name="currency_id"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2">
                  <FormLabel>العملة</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      multiple={false}
                      value={field.value || null}
                      onValueChange={(val) => field.onChange(val)}
                      options={currencyOptions}
                      placeholder="اختر العملة..."
                      searchPlaceholder="ابحث عن العملة..."
                      emptyMessage="لم يتم العثور على عملات."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Initial Balance */}
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الرصيد الافتتاحي</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: 0.00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'جاري الإرفاق...' : 'إرفاق العملة'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
