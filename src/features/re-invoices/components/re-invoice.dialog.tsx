import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, FileText, PackageOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Calendar } from '@/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { formatArabicDate } from '@/shared/lib/utils';
import { itemsApi } from '@/features/items/items.api';
import { usersApi } from '@/features/users/api/users.api';
import { ReInvoiceItemsPanel } from './re-invoice-items.panel';
import type { ReInvoice, ReInvoicePayload } from '../types';

type Currency = { id: number; expenseable_id?: number; currency: string; symbol: string; balance: string };
type Props = { open: boolean; onClose: () => void; value?: ReInvoice | null; currencies: Currency[]; modelType: string; onSubmit: (payload: ReInvoicePayload) => Promise<ReInvoice | void>; loading?: boolean; headerFields?: ReactNode; submitDisabled?: boolean };
const EMPTY_ROWS: any[] = [];


export function ReInvoiceDialog({ open, onClose, value, currencies, modelType, onSubmit, loading, headerFields, submitDisabled }: Props) {
  const form = useForm<ReInvoicePayload>();
  const initialValueRef = useRef(value);
  const initialModelTypeRef = useRef(modelType);
  initialValueRef.current = value;
  initialModelTypeRef.current = modelType;
  const { errors } = form.formState;
  const [step, setStep] = useState<'details' | 'items'>('details');
  const [activeId, setActiveId] = useState<number | undefined>(value?.id);
  const items = useQuery({ queryKey: ['items'], queryFn: () => itemsApi.getItems(1, 1000), enabled: open && step === 'details' });
  const suppliers = useQuery({ queryKey: ['users', 'supplier'], queryFn: () => usersApi.getUsersByRole('supplier', 1, 1000), enabled: open && step === 'details' });
  const itemRows = items.data?.data ?? EMPTY_ROWS;
  const supplierRows = suppliers.data?.data ?? EMPTY_ROWS;
  const currencyKey = currencies.map((currency) => currency.expenseable_id ?? currency.id).join(',');
  const selectItem = (id: string | number) => {
    const itemId = Number(id);
    form.setValue('item_id', itemId, { shouldDirty: true, shouldValidate: true });
    form.setValue('supplier_id', undefined, { shouldDirty: true, shouldValidate: true });
    const selectedItem: any = itemRows.find((item: any) => Number(item.id) === itemId);
    const linkedSupplier = selectedItem?.supplier;
    const linkedSupplierId = Number(selectedItem?.supplier_id ?? linkedSupplier?.id ?? linkedSupplier?.user?.id ?? 0);
    if (!linkedSupplierId) return;
    const matchedSupplier = supplierRows.find((supplier: any) =>
      Number(supplier.id) === linkedSupplierId || Number(supplier.user?.id) === linkedSupplierId
    );
    form.setValue('supplier_id', Number(matchedSupplier?.id ?? linkedSupplierId), { shouldDirty: true, shouldValidate: true });
  };

  useEffect(() => {
    form.register('item_id', {
      validate: (id) => {
        const itemId = Number(id);
        if (!Number.isInteger(itemId) || itemId <= 0) return 'البند مطلوب';
        return itemRows.some((item: any) => Number(item.id) === itemId) || 'البند المحدد غير صالح';
      },
    });
    form.register('supplier_id', {
      validate: (id) => {
        if (id == null || Number(id) === 0) return true;
        const supplierId = Number(id);
        if (!Number.isInteger(supplierId) || supplierId <= 0) return 'المزوّد المحدد غير صالح';
        return supplierRows.some((supplier: any) => Number(supplier.id) === supplierId)
          || 'المزوّد المحدد غير صالح';
      },
    });
    form.register('reinvoiceable_type');
    form.register('reinvoiceable_id', {
      validate: (id) => {
        const currencyId = Number(id);
        if (!Number.isInteger(currencyId) || currencyId <= 0) return 'عملة الصندوق مطلوبة';
        return currencyKey.split(',').map(Number).includes(currencyId)
          || 'عملة الصندوق المحددة غير صالحة';
      },
    });
    form.register('date', {
      validate: (date) => /^\d{4}-\d{2}-\d{2}$/.test(date ?? '')
        && !Number.isNaN(Date.parse(`${date}T00:00:00`))
        || 'التاريخ مطلوب ويجب أن يكون صالحًا',
    });
  }, [currencyKey, form, itemRows, supplierRows]);

  useEffect(() => {
    if (!open) {
      setStep('details');
      setActiveId(undefined);
      return;
    }

    // تهيئة واحدة لكل جلسة إنشاء/تعديل. تحميل القوائم لاحقًا لا يعيد ضبط النموذج.
    setStep('details');
    const initialValue = initialValueRef.current;
    setActiveId(initialValue?.id);
    form.reset({
      item_id: Number(initialValue?.item_id ?? 0),
      supplier_id: Number(initialValue?.supplier_id ?? 0) || undefined,
      reinvoiceable_type: initialModelTypeRef.current,
      reinvoiceable_id: Number(initialValue?.reinvoiceable_id ?? 0),
      date: initialValue?.date?.slice(0, 10) ?? format(new Date(), 'yyyy-MM-dd'),
      discount: Number(initialValue?.discount ?? 0),
      final_total: Number(initialValue?.final_total ?? 0),
      is_posted: Boolean(initialValue?.is_posted),
      is_visible_to_client: initialValue?.is_visible_to_client ?? true,
    });
  }, [form, open, value?.id]);

  useEffect(() => {
    if (!open) return;
    form.setValue('reinvoiceable_type', modelType, { shouldValidate: true });

    const currentCurrencyId = Number(form.getValues('reinvoiceable_id'));
    const availableCurrencyIds = currencyKey ? currencyKey.split(',').map(Number) : [];
    const currentCurrencyIsAvailable = availableCurrencyIds.includes(currentCurrencyId);

    if (availableCurrencyIds.length === 1 && !currentCurrencyIsAvailable) {
      form.setValue('reinvoiceable_id', availableCurrencyIds[0], { shouldValidate: true });
    } else if (availableCurrencyIds.length > 1 && currentCurrencyId > 0 && !currentCurrencyIsAvailable && !value?.id) {
      form.setValue('reinvoiceable_id', 0, { shouldValidate: true });
    }
  }, [currencyKey, form, modelType, open, value?.id]);

  useEffect(() => {
    if (!open || !value || !itemRows.length || form.formState.dirtyFields.item_id) return;
    const currentItemId = Number(form.getValues('item_id'));
    if (itemRows.some((item: any) => Number(item.id) === currentItemId)) return;

    const itemName = typeof value.item === 'string' ? value.item : value.item?.name;
    const matchedItem = itemName
      ? itemRows.find((item: any) => item.name?.trim() === itemName.trim())
      : undefined;
    if (matchedItem) form.setValue('item_id', Number(matchedItem.id), { shouldValidate: true });
  }, [form, itemRows, open, value]);

  useEffect(() => {
    if (!open || !value || !supplierRows.length || form.formState.dirtyFields.supplier_id) return;
    const supplierRelation = typeof value.supplier === 'object' ? value.supplier : undefined;
    const supplierName = typeof value.supplier === 'string'
      ? value.supplier
      : supplierRelation?.user?.name ?? supplierRelation?.name;
    const requestedSupplierId = Number(value.supplier_id ?? 0) || undefined;
    const matchedSupplier = supplierRows.find((supplier: any) =>
      (requestedSupplierId && Number(supplier.id) === requestedSupplierId)
      || (requestedSupplierId && Number(supplier.user?.id) === requestedSupplierId)
      || (supplierRelation?.id && Number(supplier.id) === Number(supplierRelation.id))
      || (supplierRelation?.user?.id && Number(supplier.user?.id) === Number(supplierRelation.user.id))
      || (supplierName && (supplier.user?.name ?? supplier.name)?.trim() === supplierName.trim())
    );
    if (matchedSupplier) form.setValue('supplier_id', Number(matchedSupplier.id), { shouldValidate: true });
  }, [form, open, supplierRows, value]);

  return <Dialog open={open} onOpenChange={(next) => !next && onClose()}><DialogContent className="!max-w-3xl !overflow-y-auto"><DialogHeader><DialogTitle>{value ? 'تحديث المرتجع' : 'إنشاء مرتجع'}</DialogTitle></DialogHeader>
    <Tabs value={step} onValueChange={(next) => setStep(next as 'details' | 'items')}>
      <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="details"><FileText className="ml-2 size-4" />بيانات المرتجع</TabsTrigger><TabsTrigger value="items" disabled={!activeId || form.formState.isDirty}><PackageOpen className="ml-2 size-4" />الأصناف</TabsTrigger></TabsList>
      <TabsContent value="details" className="pt-4"><form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(async (payload) => {
        if (Number(payload.discount ?? 0) > Number(payload.final_total)) {
          form.setError('discount', {
            type: 'validate',
            message: 'الخصم لا يمكن أن يتجاوز الإجمالي',
          });
          return;
        }

        const latestItems = await items.refetch();
        if (latestItems.isError) {
          form.setError('item_id', { type: 'validate', message: 'تعذر التحقق من البند، حاول مرة أخرى' });
          return;
        }

        const itemExists = (latestItems.data?.data ?? []).some(
          (item: any) => Number(item.id) === Number(payload.item_id),
        );
        if (!itemExists) {
          form.setError('item_id', { type: 'validate', message: 'البند المحدد غير موجود أو تم حذفه' });
          return;
        }

        const saved: any = await onSubmit(payload);
        const id = Number(saved?.id ?? saved?.data?.id ?? saved?.re_invoice?.id ?? saved?.reInvoice?.id ?? value?.id);
        if (Number.isInteger(id) && id > 0) {
          form.reset(payload);
          setActiveId(id);
          setStep('items');
        }
      })}>
        {headerFields}
        <label className="space-y-1"><span>البند</span><SearchableSelect loading={items.isLoading} options={itemRows.map((row: any) => ({ value: row.id, label: row.name }))} value={form.watch('item_id')} onValueChange={selectItem} placeholder="اختر البند" />{errors.item_id && <p className="text-sm text-destructive">{errors.item_id.message}</p>}</label>
        <label className="space-y-1"><span>المزوّد <span className="text-xs text-muted-foreground">(اختياري)</span></span><SearchableSelect loading={suppliers.isLoading} options={supplierRows.map((row: any) => ({ value: row.id, label: row.user?.name ?? row.name }))} value={form.watch('supplier_id')} onValueChange={(id) => form.setValue('supplier_id', Number(id), { shouldDirty: true, shouldValidate: true })} placeholder="اختر المزوّد" bottomAction={form.watch('supplier_id') ? <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => form.setValue('supplier_id', undefined, { shouldDirty: true, shouldValidate: true })}>بدون مزوّد</Button> : undefined} />{errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id.message}</p>}</label>
        <label className="space-y-1"><span>عملة الصندوق</span><SearchableSelect options={currencies.map((row) => ({ value: row.expenseable_id ?? row.id, label: `${row.currency} ${row.symbol} — ${Number(row.balance).toLocaleString()}`, className: Number(row.balance) > 0 ? 'text-success' : 'text-destructive' }))} value={form.watch('reinvoiceable_id')} onValueChange={(id) => form.setValue('reinvoiceable_id', Number(id), { shouldDirty: true, shouldValidate: true })} placeholder="اختر العملة" />{errors.reinvoiceable_id && <p className="text-sm text-destructive">{errors.reinvoiceable_id.message}</p>}</label>
        <label className="space-y-1 flex flex-col"><span>التاريخ</span>
          <Popover>
            <PopoverTrigger>
              <Button type="button" variant="ghost" className="h-10 w-full justify-between font-normal border-1  border-slate-10">
                <span>{form.watch('date') ? formatArabicDate(parseISO(form.watch('date'))) : 'اختر التاريخ'}</span>
                <CalendarIcon className="size-4 !hover:text-white" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={form.watch('date') ? parseISO(form.watch('date')) : undefined} onSelect={(date) => date && form.setValue('date', format(date, 'yyyy-MM-dd'), { shouldValidate: true })} disabled={(date) => date > new Date() || date < new Date('1900-01-01')} />
            </PopoverContent>
          </Popover>
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </label>
        <label className="space-y-1"          >
          <span>الخصم</span>
          <Input type="number" min={0} max={form.watch('final_total') ?? undefined} step="any" {...form.register('discount', {
            valueAsNumber: true,
            validate: (discount) => {
              const discountValue = Number(discount ?? 0);
              if (!Number.isFinite(discountValue) || discountValue < 0) return 'الخصم يجب أن يكون صفرًا أو أكبر';
              return discountValue <= Number(form.getValues('final_total')) || 'الخصم لا يمكن أن يتجاوز الإجمالي';
            },
          })} />
          {errors.discount && <p className="text-sm text-destructive">{errors.discount.message}</p>}
        </label>
        <label className="space-y-1">
          <span>الإجمالي</span>
          <Input type="number" min={0} step="any" {...form.register('final_total', {
            valueAsNumber: true,
            validate: (total) => {
              const totalValue = Number(total);
              if (!Number.isFinite(totalValue) || totalValue < 0) return 'الإجمالي يجب أن يكون صفرًا أو أكبر';
              return Number(form.getValues('discount') ?? 0) <= totalValue || 'الإجمالي يجب ألا يكون أقل من الخصم';
            },
            onChange: () => void form.trigger('discount'),
          })} />
          {errors.final_total && <p className="text-sm text-destructive">{errors.final_total.message}</p>}
        </label>
        <div className="flex gap-5 sm:col-span-2">
          <Controller
            control={form.control}
            name="is_posted"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2">
                <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} aria-label="مرحّل" />
                <span>مرحّل</span>
              </label>
            )}
          />
          {modelType === 'App\\Models\\ProjectFundCurrency' && (
            <Controller
              control={form.control}
              name="is_visible_to_client"
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2">
                  <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} aria-label="مرئي للعميل" />
                  <span>مرئي للعميل</span>
                </label>
              )}
            />
          )}
        </div>
        <div className="flex justify-end gap-2 sm:col-span-2"><Button type="submit" onClick={() => {
          if (Object.keys(form.formState.errors).length > 0) {
            console.log('ReInvoice form validation errors:', form.formState.errors);
          }
        }} disabled={loading || items.isFetching || submitDisabled}>{loading || items.isFetching ? 'جاري التحقق...' : value ? 'حفظ التعديلات والانتقال للأصناف' : 'إنشاء والانتقال للأصناف'}</Button></div>
      </form></TabsContent>
      <TabsContent value="items" className="pt-4">{activeId && <ReInvoiceItemsPanel reInvoiceId={activeId} onBack={() => setStep('details')} onDone={onClose} />}</TabsContent>
    </Tabs>
  </DialogContent></Dialog>;
}
