import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Calendar } from '@/shared/components/ui/calendar';
import { cn } from '@/shared/lib/utils';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';

import { useCreateInvoice, useUpdateInvoice } from '../invoices.hooks';
import type { Invoice, CreateInvoicePayload } from '../types';
import { itemsApi } from '@/features/items/items.api';
import { usersApi } from '@/features/users/api/users.api';
import { expensesApi } from '@/features/expenses/expenses.api';

const invoiceSchema = z.object({
  item_id: z.number().min(1, 'البند مطلوب'),
  expense_id: z.number().min(1, 'المصروف مطلوب'),
  supplier_id: z.number().min(1, 'المورد مطلوب'),
  date: z.date(),
  discount: z.number().min(0, 'الخصم يجب أن يكون 0 أو أكثر'),
  final_total: z.number().min(0, 'الإجمالي لا يمكن أن يكون سالباً'),
  is_posted: z.boolean(),
  is_visible_to_client: z.boolean(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

type InvoicesFormProps = {
  defaultValues?: Partial<Invoice>;
  onSuccess?: () => void;
  fixedValues?: Partial<CreateInvoicePayload>;
};

export function InvoicesForm({
  defaultValues,
  onSuccess,
  fixedValues,
}: InvoicesFormProps) {
  const { mutateAsync: createInvoice, isPending: isCreating } = useCreateInvoice();
  const { mutateAsync: updateInvoice, isPending: isUpdating } = useUpdateInvoice();
  const isPending = isCreating || isUpdating;
  const isEdit = !!defaultValues?.id;

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      item_id: fixedValues?.item_id ?? defaultValues?.item_id ?? 0,
      expense_id: fixedValues?.expense_id ?? defaultValues?.expense_id ?? 0,
      supplier_id: fixedValues?.supplier_id ?? defaultValues?.supplier_id ?? 0,
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
      discount: defaultValues?.discount ?? 0,
      final_total: defaultValues?.final_total ?? 0,
      is_posted: defaultValues?.is_posted ?? false,
      is_visible_to_client: defaultValues?.is_visible_to_client ?? true,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        item_id: fixedValues?.item_id ?? defaultValues.item_id ?? 0,
        expense_id: fixedValues?.expense_id ?? defaultValues.expense_id ?? 0,
        supplier_id: fixedValues?.supplier_id ?? defaultValues.supplier_id ?? 0,
        date: defaultValues.date ? new Date(defaultValues.date) : new Date(),
        discount: defaultValues.discount ?? 0,
        final_total: defaultValues.final_total ?? 0,
        is_posted: defaultValues.is_posted ?? false,
        is_visible_to_client: defaultValues.is_visible_to_client ?? true,
      });
    }
  }, [defaultValues, fixedValues, form]);

  // Fetch Items
  const { data: items } = useQuery({
    queryKey: ['items'],
    queryFn: itemsApi.getItems,
  });

  // Fetch Suppliers
  const { data: suppliers } = useQuery({
    queryKey: ['users', 'supplier'],
    queryFn: () => usersApi.getUsersByRole('supplier'),
  });

  // Fetch Expenses
  const { data: expensesRes } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.getExpenses(),
  });
  const expenses = expensesRes || [];

  const itemOptions = useMemo(() => {
    return items?.map((item: any) => ({
      value: item.id,
      label: item.name || `عنصر #${item.id}`
    })) || [];
  }, [items]);

  const supplierOptions = useMemo(() => {
    return suppliers?.map((s: any) => ({
      value: s.id,
      label: s.user?.name || s.name || `مورد #${s.id}`
    })) || [];
  }, [suppliers]);

  const expenseOptions = useMemo(() => {
    return expenses.map((e: any) => ({
      value: e.id,
      label: `مصروف #${e.id} - ${e.statement || e.description || ''}`
    })) || [];
  }, [expenses]);

  const onSubmit = async (values: InvoiceFormValues) => {
    try {
      const payload: CreateInvoicePayload = {
        ...values,
        date: format(values.date, 'yyyy-MM-dd'),
      };

      if (isEdit && defaultValues.id) {
        await updateInvoice({ id: defaultValues.id, payload });
      } else {
        await createInvoice(payload);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Failed to save invoice', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {!fixedValues?.item_id && (
            <FormField
              control={form.control as any}
              name="item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البند</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={itemOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="اختر البند..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {!fixedValues?.expense_id && (
            <FormField
              control={form.control as any}
              name="expense_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المصروف المرتبط</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={expenseOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="اختر المصروف..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {!fixedValues?.supplier_id && (
            <FormField
              control={form.control as any}
              name="supplier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المورد</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={supplierOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="اختر المورد..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control as any}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel>تاريخ الفاتورة</FormLabel>
                <Popover>
                  <PopoverTrigger>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal h-11',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>اختر التاريخ</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الخصم</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="final_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الإجمالي النهائي</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-4 py-4 border-t border-slate-200">
          <FormField
            control={form.control as any}
            name="is_posted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rtl:space-x-reverse">
                <FormControl>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-slate-900 peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full"></div>
                  </label>
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium text-slate-700 cursor-pointer">
                    مرحل (Posted)
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="is_visible_to_client"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rtl:space-x-reverse">
                <FormControl>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-slate-900 peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full"></div>
                  </label>
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium text-slate-700 cursor-pointer">
                    مرئي للعميل
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="submit" className="h-11 bg-slate-950 text-white min-w-[140px]" disabled={isPending}>
            {isPending ? (isEdit ? 'جاري التحديث...' : 'جاري الإضافة...') : (isEdit ? 'تحديث الفاتورة' : 'إضافة فاتورة')}
            <CheckCircle2 className="size-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
