import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { materialsApi } from '@/features/materials/materials.api';
import type { Material } from '@/features/materials/types';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { invoiceItemsApi } from '../invoice-items.api';
import { invoiceItemFormSchema, type InvoiceItemFormValues } from '../schemas/invoice-items.schema';
import type { InvoiceItem, InvoiceOption } from '../types';

type InvoiceItemFormProps = {
  defaultValues?: InvoiceItem | null;
  onSubmit: (data: InvoiceItemFormValues) => Promise<void>;
  loading?: boolean;
};

function getInvoiceId(item?: InvoiceItem | null) {
  return item?.invoice_id ?? item?.invoice?.id ?? 0;
}

function getMaterialId(item?: InvoiceItem | null) {
  return item?.material_id ?? item?.material?.id ?? 0;
}

export function InvoiceItemForm({ defaultValues, onSubmit, loading }: InvoiceItemFormProps) {
  const { data: invoices = [] } = useQuery<InvoiceOption[]>({
    queryKey: ['invoice-items', 'invoices'] as const,
    queryFn: () => invoiceItemsApi.getInvoices(),
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['invoice-items', 'materials'] as const,
    queryFn: () => materialsApi.getMaterials(),
  });

  const form = useForm<InvoiceItemFormValues>({
    resolver: zodResolver(invoiceItemFormSchema),
    defaultValues: {
      invoice_id: getInvoiceId(defaultValues),
      material_id: getMaterialId(defaultValues),
      item_description: defaultValues?.item_description ?? '',
      unit: defaultValues?.unit ?? '',
      quantity: defaultValues?.quantity ?? 0,
      unit_price: defaultValues?.unit_price ?? 0,
    },
  });

  useEffect(() => {
    form.reset({
      invoice_id: getInvoiceId(defaultValues),
      material_id: getMaterialId(defaultValues),
      item_description: defaultValues?.item_description ?? '',
      unit: defaultValues?.unit ?? '',
      quantity: defaultValues?.quantity ?? 0,
      unit_price: defaultValues?.unit_price ?? 0,
    });
  }, [defaultValues, form]);

  const quantity = form.watch('quantity');
  const unitPrice = form.watch('unit_price');
  const totalPrice = useMemo(() => {
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    return qty * price;
  }, [quantity, unitPrice]);

  const invoiceOptions =
    defaultValues?.invoice && !invoices.some((invoice) => invoice.id === defaultValues.invoice?.id)
      ? [
          {
            id: defaultValues.invoice.id,
            invoice_number: defaultValues.invoice.invoice_number,
          },
          ...invoices,
        ]
      : invoices;

  const materialOptions =
    defaultValues?.material && !materials.some((material) => material.id === defaultValues.material?.id)
      ? [defaultValues.material, ...materials]
      : materials;

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <FormField
          control={form.control}
          name="invoice_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الفاتورة</FormLabel>
              <FormControl>
                <select
                  value={field.value ? String(field.value) : ''}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                  className="field-control"
                >
                  <option value="" disabled>
                    اختر الفاتورة
                  </option>
                  {invoiceOptions.map((invoice) => (
                    <option key={invoice.id} value={String(invoice.id)}>
                      {invoice.invoice_number}
                      {invoice.supplier ? ` — ${invoice.supplier}` : ''}
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
          name="material_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المادة</FormLabel>
              <FormControl>
                <select
                  value={field.value ? String(field.value) : ''}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                  className="field-control"
                >
                  <option value="" disabled>
                    اختر المادة
                  </option>
                  {materialOptions.map((material) => (
                    <option key={material.id} value={String(material.id)}>
                      {material.name}
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
          name="item_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>وصف الصنف</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الوحدة</FormLabel>
              <FormControl>
                <Input {...field} placeholder="قطعة" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الكمية</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>سعر الوحدة</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">الإجمالي</p>
          <p className="finance-num text-lg font-semibold text-primary">{totalPrice.toFixed(2)}</p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'جاري الحفظ...' : defaultValues ? 'حفظ التعديلات' : 'إضافة صنف'}
        </Button>
      </form>
    </Form>
  );
}
