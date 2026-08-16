import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { currenciesApi } from '@/features/currencies/currencies.api';

const moneyExchangeSchema = z.object({
  from_currency: z.string().min(1, 'الرجاء اختيار العملة المصدر'),
  to_currency: z.string().min(1, 'الرجاء اختيار العملة الهدف'),
  amount: z.string().min(1, 'المبلغ مطلوب').refine((val) => !isNaN(Number(val.replace(/,/g, ''))) && Number(val.replace(/,/g, '')) > 0, 'المبلغ يجب أن يكون أكبر من الصفر'),
  exchange_rate: z.string().min(1, 'سعر التصريف مطلوب').refine((val) => !isNaN(Number(val.replace(/,/g, ''))) && Number(val.replace(/,/g, '')) > 0, 'سعر التصريف يجب أن يكون أكبر من الصفر'),
  operation: z.enum(['multiply', 'divide'], {
    error: 'الرجاء تحديد العملية',
  }),
}).refine((data) => data.from_currency !== data.to_currency, {
  message: 'يجب اختيار عملة هدف مختلفة عن عملة المصدر',
  path: ['to_currency'],
});

type MoneyExchangeFormValues = z.infer<typeof moneyExchangeSchema>;

type MoneyExchangeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundCurrencies: {
    id: number;
    expenseable_id?: number;
    currency: string;
    symbol: string;
    balance: string;
  }[];
  onSubmit: (values: {
    exchangeable_id: number;
    from_currency: number;
    to_currency: number;
    amount: number;
    exchange_rate: number;
    operation: 'multiply' | 'divide';
  }) => Promise<void>;
  loading?: boolean;
};

export function MoneyExchangeDialog({
  open,
  onOpenChange,
  fundCurrencies,
  onSubmit,
  loading,
}: MoneyExchangeDialogProps) {
  const form = useForm<MoneyExchangeFormValues>({
    resolver: zodResolver(moneyExchangeSchema),
    defaultValues: {
      from_currency: '',
      to_currency: '',
      amount: '',
      exchange_rate: '',
      operation: 'multiply',
    },
  });

  const currenciesQuery = useQuery({
    queryKey: ['currencies'] as const,
    queryFn: () => currenciesApi.getAll(1, 1000),
    enabled: open,
  });

  const allCurrencies = currenciesQuery.data?.data ?? [];

  useEffect(() => {
    if (!open) {
      form.reset({
        from_currency: '',
        to_currency: '',
        amount: '',
        exchange_rate: '',
        operation: 'multiply',
      });
    }
  }, [form, open]);

  const handleSubmitForm = async (values: MoneyExchangeFormValues) => {
    const selectedCurrency = fundCurrencies.find((c) => String(c.id) === values.from_currency);
    const exchangeableId = selectedCurrency
      ? (selectedCurrency.expenseable_id ?? selectedCurrency.id)
      : 0;

    await onSubmit({
      exchangeable_id: exchangeableId,
      from_currency: Number(values.from_currency),
      to_currency: Number(values.to_currency),
      amount: Number(values.amount.replace(/,/g, '')),
      exchange_rate: Number(values.exchange_rate.replace(/,/g, '')),
      operation: values.operation,
    });
  };

  const formatNumberWithCommas = (value: string) => {
    if (!value) return '';
    const clean = value.replace(/,/g, '');
    if (isNaN(Number(clean))) return value;
    const parts = clean.split('.');
    parts[0] = Number(parts[0]).toLocaleString('en-US');
    return parts.join('.');
  };

  const parseNumberFromCommas = (value: string) => {
    return value.replace(/,/g, '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>تصريف عملة</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmitForm)}>
            <FormField
              control={form.control}
              name="from_currency"
              render={({ field }) => {
                const selected = fundCurrencies.find((c) => String(c.id) === field.value);
                return (
                  <FormItem>
                    <FormLabel>من العملة</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          {field.value && selected ? (
                            <span>{selected.currency} ({selected.symbol})</span>
                          ) : (
                            <SelectValue placeholder="اختر العملة المصدر" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fundCurrencies.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.currency} ({c.symbol}) - الرصيد: {Number(c.balance).toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="to_currency"
              render={({ field }) => {
                const selected = allCurrencies.find((c) => String(c.id) === field.value);
                return (
                  <FormItem>
                    <FormLabel>إلى العملة</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          {field.value && selected ? (
                            <span>{selected.currency} ({selected.symbol})</span>
                          ) : (
                            <SelectValue placeholder="اختر العملة الهدف" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allCurrencies.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.currency} ({c.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المبلغ المراد تصريفه</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="100"
                      value={formatNumberWithCommas(field.value)}
                      onChange={(e) => {
                        const parsed = parseNumberFromCommas(e.target.value);
                        if (parsed === '' || /^\d*\.?\d*$/.test(parsed)) {
                          field.onChange(parsed);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exchange_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>سعر التصريف</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="500"
                      value={formatNumberWithCommas(field.value)}
                      onChange={(e) => {
                        const parsed = parseNumberFromCommas(e.target.value);
                        if (parsed === '' || /^\d*\.?\d*$/.test(parsed)) {
                          field.onChange(parsed);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العملية</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        {field.value === 'multiply' ? (
                          'ضرب (*)'
                        ) : field.value === 'divide' ? (
                          'قسمة (/)'
                        ) : (
                          <SelectValue placeholder="اختر العملية" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="multiply">ضرب (*)</SelectItem>
                      <SelectItem value="divide">قسمة (/)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading || currenciesQuery.isLoading}>
              {loading ? 'جاري تصريف العملة...' : 'تصريف'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
