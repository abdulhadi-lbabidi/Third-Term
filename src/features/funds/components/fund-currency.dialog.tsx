import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import type { FundCurrency } from '../types';
import { attachFundCurrencySchema, type AttachFundCurrencyValues } from '../schemas/funds.schema';

type FundCurrencyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: FundCurrency | null;
  onSubmit: (values: { currency_id: number; balance: string }) => Promise<void>;
  loading?: boolean;
};

export function FundCurrencyDialog({ open, onOpenChange, currency, onSubmit, loading }: FundCurrencyDialogProps) {
  const form = useForm<AttachFundCurrencyValues>({
    resolver: zodResolver(attachFundCurrencySchema),
    defaultValues: { currency_id: 0, balance: '' },
  });

  useEffect(() => {
    if (open && currency) {
      form.reset({ currency_id: currency.id, balance: currency.balance });
      return;
    }
    if (!open) {
      form.reset({ currency_id: 0, balance: '' });
    }
  }, [currency, form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{currency ? `تعديل ${currency.currency}` : 'تعديل العملة'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              await onSubmit({
                currency_id: values.currency_id,
                balance: values.balance,
              });
            })}
          >
            <FormField
              control={form.control}
              name="currency_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العملة</FormLabel>
                  <FormControl>
                    <Input value={currency ? `${currency.currency} ${currency.symbol}` : ''} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="balance"
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
