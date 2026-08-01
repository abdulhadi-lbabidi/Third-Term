import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import type { GenericFundCurrency } from './generic-fund.card';
import { attachFundCurrencySchema, type AttachFundCurrencyValues } from '@/features/funds/schemas/funds.schema';

type GenericFundCurrencyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: GenericFundCurrency | null;
  onSubmit: (values: { currency_id: number; balance: number }) => Promise<void>;
  loading?: boolean;
};

export function GenericFundCurrencyDialog({ open, onOpenChange, currency, onSubmit, loading }: GenericFundCurrencyDialogProps) {
  const form = useForm<AttachFundCurrencyValues>({
    resolver: zodResolver(attachFundCurrencySchema),
    defaultValues: { currency_id: 0, balance: 0 },
  });

  useEffect(() => {
    if (open && currency) {
      form.reset({ currency_id: currency.id, balance: Number(currency.balance) });
      return;
    }
    if (!open) {
      form.reset({ currency_id: 0, balance: 0 });
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
                balance: Number(values.balance),
              });
            })}
          >
            <FormField
              control={form.control}
              name="currency_id"
              render={() => (
                <FormItem>
                  <FormLabel>العملة</FormLabel>
                  <FormControl>
                    <Input value={currency ? `${currency.currency} ${currency.symbol}` : ''} disabled />
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
