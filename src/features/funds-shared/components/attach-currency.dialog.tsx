import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { cn } from '@/shared/lib/utils';
import type { Currency } from '@/features/currencies/types';
import { attachFundCurrencySchema, type AttachFundCurrencyValues } from '@/features/funds/schemas/funds.schema';

type AttachCurrencyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencies: Currency[];
  onSubmit: (values: { currency_id: number; balance: number }) => Promise<void>;
  loading?: boolean;
  currenciesLoading?: boolean;
  title?: string;
};

export function AttachCurrencyDialog({
  open,
  onOpenChange,
  currencies,
  onSubmit,
  loading,
  currenciesLoading = false,
  title = 'إضافة عملة للصندوق',
}: AttachCurrencyDialogProps) {
  const form = useForm<AttachFundCurrencyValues>({
    resolver: zodResolver(attachFundCurrencySchema),
    defaultValues: { currency_id: 0, balance: 0 },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ currency_id: 0, balance: 0 });
    }
  }, [form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
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
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2">
                  <FormLabel>العملة</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {currenciesLoading ? (
                        <div className="flex w-full flex-wrap gap-2">
                          <Skeleton className="h-8 w-20 rounded-md" />
                          <Skeleton className="h-8 w-24 rounded-md" />
                          <Skeleton className="h-8 w-16 rounded-md" />
                        </div>
                      ) : currencies.length === 0 ? (
                        <p className="w-full py-2 text-center text-sm text-muted-foreground">
                          لا يوجد عملات متاحة للإرفاق
                        </p>
                      ) : (
                        currencies.map((currency) => {
                          const isSelected = field.value === currency.id;
                          return (
                            <button
                              key={currency.id}
                              type="button"
                              onClick={() => field.onChange(currency.id)}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                                isSelected
                                  ? 'border-sky-500 bg-sky-500 text-white'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              )}
                            >
                              <span>{currency.currency}</span>
                              <span className={cn('text-xs', isSelected ? 'text-sky-100' : 'text-slate-400')}>
                                {currency.symbol}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <Button type="submit" className="w-full" disabled={loading || currenciesLoading}>
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
