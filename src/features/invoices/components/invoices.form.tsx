import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatArabicDate } from '@/shared/lib/utils';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
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
import { ItemsDialog } from '@/features/items/components/items.dialog';
import { ExpensesDialog } from '@/features/expenses/components/expenses.dialog';
import { NumberStepper } from '@/shared/components/ui/number-stepper';

const invoiceSchema = z.object({
  item_id: z.number().min(1, 'البند مطلوب'),
  expense_id: z.number().min(1, 'المصروف مطلوب'),
  supplier_id: z.number().optional(),
  date: z.date(),
  discount: z.number().min(0, 'الخصم يجب أن يكون 0 أو أكثر'),
  final_total: z.number().min(0, 'الإجمالي لا يمكن أن يكون سالباً'),
  is_posted: z.boolean(),
  is_visible_to_client: z.boolean(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

type InvoicesFormProps = {
  defaultValues?: Partial<Invoice>;
  onSuccess?: (invoice?: Invoice) => void;
  onCancel?: () => void;
  fixedValues?: Partial<CreateInvoicePayload>;
};

export function InvoicesForm({
  defaultValues,
  onSuccess,
  onCancel,
  fixedValues,
}: InvoicesFormProps) {
  const { mutateAsync: createInvoice, isPending: isCreating } = useCreateInvoice();
  const { mutateAsync: updateInvoice, isPending: isUpdating } = useUpdateInvoice();
  const isPending = isCreating || isUpdating;
  const isEdit = !!defaultValues?.id;

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      item_id: Number(fixedValues?.item_id ?? defaultValues?.item_id ?? 0),
      expense_id: Number(
        fixedValues?.expense_id ?? defaultValues?.expense_id ?? defaultValues?.expense?.id ?? 0
      ),
      supplier_id: Number(fixedValues?.supplier_id ?? defaultValues?.supplier_id ?? 0),
      date: defaultValues?.date ? new Date(defaultValues.date) : new Date(),
      discount: Number(defaultValues?.discount ?? 0),
      final_total: Number(defaultValues?.final_total ?? 0),
      is_posted: Boolean(defaultValues?.is_posted ?? false),
      is_visible_to_client: Boolean(defaultValues?.is_visible_to_client ?? true),
    },
  });

  const queryClient = useQueryClient();
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  const createItemMutation = useMutation({
    mutationFn: itemsApi.createItem,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      if (res?.data?.id || res?.id) {
        form.setValue('item_id', res.data?.id || res.id);
      }
      setIsItemDialogOpen(false);
      toast.success('تم إضافة البند بنجاح');
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      if (res?.data?.id || res?.id) {
        form.setValue('expense_id', res.data?.id || res.id);
      }
      setIsExpenseDialogOpen(false);
      toast.success('تم إضافة المصروف بنجاح');
    },
  });

  // Fetch Items
  const { data: itemsRes } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.getItems(1, 1000),
  });
  const items = itemsRes?.data ?? (Array.isArray(itemsRes) ? itemsRes : []);

  // Fetch Suppliers
  const { data: suppliersRes } = useQuery({
    queryKey: ['users', 'supplier'],
    queryFn: () => usersApi.getUsersByRole('supplier', 1, 1000),
  });
  const suppliers = (suppliersRes as any)?.data ?? (Array.isArray(suppliersRes) ? suppliersRes : []);

  // Fetch Expenses
  const { data: expensesRes } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expensesApi.getExpenses(),
  });
  const expenses = expensesRes?.data ?? (Array.isArray(expensesRes) ? expensesRes : []);
  const selectedExpenseId = form.watch('expense_id');
  const selectedExpense = expenses.find((expense: any) => expense.id === selectedExpenseId)
    ?? defaultValues?.expense;
  const currencyCode = (selectedExpense as any)?.expenseable_info?.details?.currency?.currency;
  const moneyStep = currencyCode === 'SYP' ? 100 : currencyCode === 'TRY' ? 20 : 1;

  useEffect(() => {
    if (!defaultValues) return;

    const itemName = typeof defaultValues.item === 'string'
      ? defaultValues.item
      : defaultValues.item?.name;
    const supplierRelation = typeof defaultValues.supplier === 'object'
      ? defaultValues.supplier as any
      : undefined;
    const supplierName = typeof defaultValues.supplier === 'string'
      ? defaultValues.supplier
      : supplierRelation?.user?.name ?? supplierRelation?.name;
    const supplierRelationId = Number(supplierRelation?.id ?? 0) || undefined;
    const supplierUserId = Number(supplierRelation?.user?.id ?? supplierRelation?.id ?? 0) || undefined;

    const matchedItem = itemName
      ? items.find((item: any) => item.name?.trim() === itemName.trim())
      : undefined;
    const requestedSupplierId = Number(fixedValues?.supplier_id ?? defaultValues.supplier_id ?? 0) || undefined;
    const matchedSupplier = suppliers.find((supplier: any) =>
      (requestedSupplierId && Number(supplier.id) === requestedSupplierId)
      || (requestedSupplierId && Number(supplier.user?.id) === requestedSupplierId)
      || (supplierRelationId && Number(supplier.id) === supplierRelationId)
      || (supplierUserId && Number(supplier.user?.id) === supplierUserId)
      || (supplierName && (supplier.user?.name || supplier.name)?.trim() === supplierName.trim())
    );
    const matchedSupplierId = matchedSupplier?.id;

    form.reset({
      item_id: Number(fixedValues?.item_id ?? defaultValues.item_id ?? matchedItem?.id ?? 0),
      expense_id: Number(
        fixedValues?.expense_id ?? defaultValues.expense_id ?? defaultValues.expense?.id ?? 0
      ),
      supplier_id: Number(
        matchedSupplierId
        ?? fixedValues?.supplier_id
        ?? defaultValues.supplier_id
        ?? supplierRelationId
        ?? 0
      ),
      date: defaultValues.date ? new Date(defaultValues.date) : new Date(),
      discount: Number(defaultValues.discount ?? 0),
      final_total: Number(defaultValues.final_total ?? 0),
      is_posted: Boolean(defaultValues.is_posted ?? false),
      is_visible_to_client: Boolean(defaultValues.is_visible_to_client ?? true),
    });
  }, [defaultValues, fixedValues, form, items, suppliers]);

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
      if (!payload.supplier_id) delete payload.supplier_id;

      if (isEdit && defaultValues.id) {
        const invoice = await updateInvoice({ id: defaultValues.id, payload });
        onSuccess?.(invoice as Invoice);
      } else {
        const invoice = await createInvoice(payload);
        onSuccess?.(invoice as Invoice);
      }
    } catch (error) {
      console.error('Failed to save invoice', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid gap-4 md:grid-cols-2 items-start">
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
                      bottomAction={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-primary"
                          onClick={() => setIsItemDialogOpen(true)}
                        >
                          <Plus className="mr-2 size-4" />
                          إضافة بند جديد
                        </Button>
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
                    bottomAction={
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-primary"
                        onClick={() => setIsExpenseDialogOpen(true)}
                      >
                        <Plus className="mr-2 size-4" />
                        إضافة مصروف جديد
                      </Button>
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الخصم</FormLabel>
                <FormControl>
                  <NumberStepper value={field.value} onChange={field.onChange} step={moneyStep} min={0} />
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
                  <NumberStepper value={field.value} onChange={field.onChange} step={moneyStep} min={0} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid items-end gap-3 pt-1 md:grid-cols-2 grid-cols-1">
          <FormField
            control={form.control as any}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>تاريخ الفاتورة</FormLabel>
                <Popover>
                  <PopoverTrigger>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn('h-10 w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                      >
                        {field.value ? formatArabicDate(field.value) : <span>اختر التاريخ</span>}
                        <CalendarIcon className="ml-auto size-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='grid grid-cols-2'>
            <FormField
              control={form.control as any}
              name="is_posted"
              render={({ field }) => (
                <FormItem className="flex h-10 flex-row items-center gap-2 rounded-md px-3">
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
                  <div className="leading-none">
                    <FormLabel className="text-sm font-medium text-slate-700 cursor-pointer">
                      مرحل
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="is_visible_to_client"
              render={({ field }) => (
                <FormItem className="flex h-10 flex-row items-center gap-2 rounded-md px-3">
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
                  <div className="leading-none">
                    <FormLabel className="text-sm font-medium text-slate-700 cursor-pointer">
                      مرئي للعميل
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

        </div>

        <div className="flex items-center justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" className="h-11 min-w-[100px]" onClick={onCancel} disabled={isPending}>
              إلغاء
            </Button>
          )}
          <Button type="submit" className="h-11 min-w-[140px]" disabled={isPending}>
            <CheckCircle2 className="size-4 ml-2" />
            {isPending ? (isEdit ? 'جاري التحديث...' : 'جاري الإضافة...') : (isEdit ? 'تحديث الفاتورة' : 'إضافة فاتورة')}
          </Button>
        </div>
      </form>

      {/* Dialogs */}
      <ItemsDialog
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
        onSubmit={async (data) => {
          await createItemMutation.mutateAsync(data);
        }}
        loading={createItemMutation.isPending}
      />

      <ExpensesDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        onSubmit={async (data) => {
          await createExpenseMutation.mutateAsync(data);
        }}
        loading={createExpenseMutation.isPending}
      />

    </Form>
  );
}
