import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calculator, Plus, RotateCcw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { materialsApi } from '@/features/materials/materials.api';
import type { Material } from '@/features/materials/types';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { NumberStepper } from '@/shared/components/ui/number-stepper';
import { MaterialDialog } from '@/features/materials/components/material.dialog';
import { invoiceItemsApi } from '../invoice-items.api';
import { invoiceItemFormSchema, type InvoiceItemFormValues } from '../schemas/invoice-items.schema';
import type { InvoiceItem, InvoiceOption } from '../types';

type InvoiceItemFormProps = {
  formId?: string;
  defaultValues?: InvoiceItem | null;
  fixedInvoiceId?: number;
  currencyLabel?: string;
  priceStep?: number;
  onSubmit: (data: InvoiceItemFormValues) => Promise<void>;
  onAddOnly?: () => void;
  onInvalid?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
};

function getInvoiceId(item?: InvoiceItem | null) {
  return item?.invoice_id ?? item?.invoice?.id ?? 0;
}

function getMaterialId(item?: InvoiceItem | null) {
  return item?.material_id ?? item?.material?.id ?? 0;
}

export function InvoiceItemForm({ formId, defaultValues, fixedInvoiceId, currencyLabel, priceStep = 1, onSubmit, onAddOnly, onInvalid, onDirtyChange, loading, disabled }: InvoiceItemFormProps) {
  const queryClient = useQueryClient();
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const { data: invoices = [] } = useQuery<InvoiceOption[]>({
    queryKey: ['invoice-items', 'invoices'] as const,
    queryFn: () => invoiceItemsApi.getInvoices(),
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['invoice-items', 'materials'] as const,
    queryFn: async () => {
      const response = await materialsApi.getMaterials(1, 100);
      return response.data;
    },
  });

  const form = useForm<InvoiceItemFormValues>({
    resolver: zodResolver(invoiceItemFormSchema) as any,
    defaultValues: {
      invoice_id: fixedInvoiceId ?? getInvoiceId(defaultValues),
      material_id: getMaterialId(defaultValues),
      item_description: defaultValues?.item_description ?? '',
      unit: defaultValues?.unit ?? '',
      quantity: defaultValues?.quantity ?? 0,
      unit_price: defaultValues?.unit_price ?? 0,
    },
  });

  useEffect(() => {
    form.reset({
      invoice_id: fixedInvoiceId ?? getInvoiceId(defaultValues),
      material_id: getMaterialId(defaultValues),
      item_description: defaultValues?.item_description ?? '',
      unit: defaultValues?.unit ?? '',
      quantity: defaultValues?.quantity ?? 0,
      unit_price: defaultValues?.unit_price ?? 0,
    });
  }, [defaultValues, fixedInvoiceId, form]);

  useEffect(() => {
    onDirtyChange?.(form.formState.isDirty);
  }, [form.formState.isDirty, onDirtyChange]);

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

  const createMaterialMutation = useMutation({
    mutationFn: materialsApi.createMaterial,
    onSuccess: async (material) => {
      await queryClient.invalidateQueries({ queryKey: ['invoice-items', 'materials'] });
      form.setValue('material_id', material.id);
      if (material.unit) form.setValue('unit', material.unit);
      if (material.description) form.setValue('item_description', material.description);
      setMaterialDialogOpen(false);
    },
  });

  return (
    <Form {...form}>
      <form
        id={formId}
        className="space-y-3"
        onSubmit={form.handleSubmit(
          async (values) => {
            await onSubmit(values);
          },
          () => onInvalid?.(),
        )}
      >
        {!fixedInvoiceId && <FormField
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
        />}

        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(140px,1fr)]">
          <FormField
            control={form.control}
            name="material_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المادة</FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(value) => {
                      const materialId = Number(value);
                      field.onChange(materialId);
                      const material = materialOptions.find((option) => option.id === materialId);
                      if (material?.unit) form.setValue('unit', material.unit);
                      if (material?.description && !form.getValues('item_description')) {
                        form.setValue('item_description', material.description);
                      }
                    }}
                    options={materialOptions.map((material) => ({ value: String(material.id), label: material.name }))}
                    placeholder="اختر المادة"
                    searchPlaceholder="ابحث عن مادة..."
                    emptyMessage="لا توجد مواد."
                    bottomAction={
                      <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => setMaterialDialogOpen(true)}>
                        <Plus className="ml-2 size-4" />إضافة مادة جديدة
                      </Button>
                    }
                  />
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
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الكمية</FormLabel>
                <FormControl>
                  <NumberStepper value={field.value ?? 0} onChange={field.onChange} step={1} min={0} />
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
                <FormLabel>سعر الوحدة {currencyLabel ? `(${currencyLabel})` : ''}</FormLabel>
                <FormControl>
                  <NumberStepper value={field.value ?? 0} onChange={field.onChange} step={priceStep} min={0} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex min-h-16 items-center gap-2.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
            <Calculator className="size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">الإجمالي</p>
              <p className="finance-num truncate text-base font-semibold text-foreground">
                {totalPrice.toFixed(2)} {currencyLabel}
              </p>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="item_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البيان</FormLabel>
              <FormControl><Textarea {...field} rows={2} className="min-h-16 resize-none" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          {!defaultValues && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => form.reset({
                invoice_id: fixedInvoiceId ?? 0,
                material_id: 0,
                item_description: '',
                unit: '',
                quantity: 0,
                unit_price: 0,
              })}
              disabled={loading || disabled}
            >
              <RotateCcw className="size-4" />
              مسح البيانات
            </Button>
          )}
          <Button type="submit" size="sm" className="min-w-28" disabled={loading || disabled} onClick={onAddOnly}>
            {loading ? 'جاري الحفظ...' : defaultValues ? 'حفظ التعديلات' : 'إضافة صنف'}
          </Button>
        </div>
      </form>
      <MaterialDialog
        open={materialDialogOpen}
        onOpenChange={setMaterialDialogOpen}
        onSubmit={async (values) => { await createMaterialMutation.mutateAsync(values); }}
        loading={createMaterialMutation.isPending}
      />
    </Form>
  );
}
