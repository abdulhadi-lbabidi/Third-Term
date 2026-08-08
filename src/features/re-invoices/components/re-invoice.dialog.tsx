import { useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, FileText, PackageOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
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
  const { errors } = form.formState;
  const [step, setStep] = useState<'details' | 'items'>('details');
  const [activeId, setActiveId] = useState<number | undefined>(value?.id);
  const items = useQuery({ queryKey: ['items'], queryFn: () => itemsApi.getItems(1, 1000), enabled: open && step === 'details' });
  const suppliers = useQuery({ queryKey: ['users', 'supplier'], queryFn: () => usersApi.getUsersByRole('supplier', 1, 1000), enabled: open && step === 'details' });
  const itemRows = items.data?.data ?? EMPTY_ROWS;
  const supplierRows = suppliers.data?.data ?? EMPTY_ROWS;
  const selectItem = (id: string | number) => {
    const itemId = Number(id);
    form.setValue('item_id', itemId, { shouldDirty: true, shouldValidate: true });
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
      validate: (id) => Number(id) > 0 || 'البند مطلوب',
    });
    form.register('supplier_id', {
      validate: (id) => Number(id) > 0 || 'المزوّد مطلوب',
    });
  }, [form]);

  useEffect(() => {
    if (!open) return;
    const itemName = typeof value?.item === 'string' ? value.item : value?.item?.name;
    const matchedItem = itemName ? itemRows.find((item: any) => item.name?.trim() === itemName.trim()) : undefined;
    const supplierRelation = typeof value?.supplier === 'object' ? value.supplier : undefined;
    const supplierName = typeof value?.supplier === 'string' ? value.supplier : supplierRelation?.user?.name ?? supplierRelation?.name;
    const requestedSupplierId = Number(value?.supplier_id ?? 0) || undefined;
    const matchedSupplier = supplierRows.find((supplier: any) =>
      (requestedSupplierId && Number(supplier.id) === requestedSupplierId)
      || (requestedSupplierId && Number(supplier.user?.id) === requestedSupplierId)
      || (supplierRelation?.id && Number(supplier.id) === Number(supplierRelation.id))
      || (supplierRelation?.user?.id && Number(supplier.user?.id) === Number(supplierRelation.user.id))
      || (supplierName && (supplier.user?.name ?? supplier.name)?.trim() === supplierName.trim())
    );
    setStep('details'); setActiveId(value?.id);
    form.reset({ item_id: Number(value?.item_id ?? matchedItem?.id ?? 0), supplier_id: matchedSupplier?.id ?? requestedSupplierId, reinvoiceable_type: modelType, reinvoiceable_id: value?.reinvoiceable_id ?? (currencies.length === 1 ? (currencies[0].expenseable_id ?? currencies[0].id) : 0), date: value?.date?.slice(0, 10) ?? format(new Date(), 'yyyy-MM-dd'), discount: Number(value?.discount ?? 0), final_total: Number(value?.final_total ?? 0), is_posted: Boolean(value?.is_posted), is_visible_to_client: value?.is_visible_to_client ?? true });
  }, [currencies, form, itemRows, modelType, open, supplierRows, value]);

  return <Dialog open={open} onOpenChange={(next) => !next && onClose()}><DialogContent className="!max-w-3xl !overflow-y-auto"><DialogHeader><DialogTitle>{value ? 'تحديث المرتجع' : 'إنشاء مرتجع'}</DialogTitle></DialogHeader>
    <Tabs value={step} onValueChange={(next) => setStep(next as 'details' | 'items')}>
      <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="details"><FileText className="ml-2 size-4" />بيانات المرتجع</TabsTrigger><TabsTrigger value="items" disabled={!activeId}><PackageOpen className="ml-2 size-4" />الأصناف</TabsTrigger></TabsList>
      <TabsContent value="details" className="pt-4"><form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(async (payload) => { const saved: any = await onSubmit(payload); const id = saved?.id ?? value?.id; if (id) { setActiveId(id); setStep('items'); } })}>
        {headerFields}
        <label className="space-y-1"><span>البند</span><SearchableSelect loading={items.isLoading} options={itemRows.map((row: any) => ({ value: row.id, label: row.name }))} value={form.watch('item_id')} onValueChange={selectItem} placeholder="اختر البند" />{errors.item_id && <p className="text-sm text-destructive">{errors.item_id.message}</p>}</label>
        <label className="space-y-1"><span>المزوّد</span><SearchableSelect loading={suppliers.isLoading} options={supplierRows.map((row: any) => ({ value: row.id, label: row.user?.name ?? row.name }))} value={form.watch('supplier_id')} onValueChange={(id) => form.setValue('supplier_id', Number(id), { shouldDirty: true, shouldValidate: true })} placeholder="اختر المزوّد" />{errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id.message}</p>}</label>
        <label className="space-y-1"><span>عملة الصندوق</span><SearchableSelect options={currencies.map((row) => ({ value: row.expenseable_id ?? row.id, label: `${row.currency} ${row.symbol} — ${Number(row.balance).toLocaleString()}`, className: Number(row.balance) > 0 ? 'text-success' : 'text-destructive' }))} value={form.watch('reinvoiceable_id')} onValueChange={(id) => form.setValue('reinvoiceable_id', Number(id))} placeholder="اختر العملة" /></label>
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
        </label>
        <label className="space-y-1"          >
          <span>الخصم</span>
          <Input type="number" min={0} step="any" {...form.register('discount', { valueAsNumber: true })} />
        </label>
        <label className="space-y-1">
          <span>الإجمالي</span>
          <Input type="number" min={0} step="any" {...form.register('final_total', { required: true, valueAsNumber: true })} />
        </label>
        <div className="flex gap-5 sm:col-span-2">
          <label className="flex gap-2">
            <input type="checkbox" {...form.register('is_posted')} />مرحل</label>
          {modelType === 'App\\Models\\ProjectFundCurrency' && <label className="flex gap-2"><input type="checkbox" {...form.register('is_visible_to_client')} />مرئي للعميل</label>}
        </div>
        <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={onClose}>إلغاء</Button><Button type="submit" disabled={loading || submitDisabled}>{loading ? 'جاري الحفظ...' : activeId ? 'حفظ والمتابعة' : 'إنشاء والمتابعة'}</Button></div>
      </form></TabsContent>
      <TabsContent value="items" className="pt-4">{activeId && <ReInvoiceItemsPanel reInvoiceId={activeId} onDone={onClose} />}</TabsContent>
    </Tabs>
  </DialogContent></Dialog>;
}
