import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import type { Currency } from '@/features/currencies/types';

type AttachCurrencyValues = {
  currency_id: string;
  balance: string;
};

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
  const form = useForm<AttachCurrencyValues>({
    defaultValues: { currency_id: '', balance: '' },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ currency_id: '', balance: '' });
    }
  }, [form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>حفظ عملة بالصندوق</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit({
                currency_id: Number(values.currency_id),
                balance: values.balance,
              });
            })}
          >
            <FormField
              control={form.control}
              name="currency_id"
              rules={{ required: 'العملة مطلوبة' }}
              render={({ field }) => (
                <FormItem>
                <FormLabel>العملة</FormLabel>
                <FormControl>
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  >
                    <option value="">اختر العملة</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={String(currency.id)}>
                        {currency.currency} {currency.symbol}
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
              name="balance"
              rules={{ required: 'الرصيد مطلوب' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الرصيد</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0.00" />
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
      </DialogContent>
    </Dialog>
  );
}
