import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { itemsApi } from '@/features/items/items.api';
import { usersApi } from '@/features/users/api/users.api';
import type { ReInvoice, ReInvoicePayload } from '../types';

type Currency = { id: number; expenseable_id?: number; currency: string; symbol: string; balance: string };
export function ReInvoiceDialog({ open, onClose, value, currencies, modelType, onSubmit, loading }: { open: boolean; onClose: () => void; value?: ReInvoice | null; currencies: Currency[]; modelType: string; onSubmit: (payload: ReInvoicePayload) => Promise<void>; loading?: boolean }) {
  const form = useForm<ReInvoicePayload>();
  const items = useQuery({ queryKey: ['items'], queryFn: () => itemsApi.getItems(1, 1000), enabled: open });
  const suppliers = useQuery({ queryKey: ['users', 'supplier'], queryFn: () => usersApi.getUsersByRole('supplier', 1, 1000), enabled: open });
  useEffect(() => { if (open) form.reset({ item_id: value?.item_id ?? 0, supplier_id: value?.supplier_id, reinvoiceable_type: modelType, reinvoiceable_id: value?.reinvoiceable_id ?? (currencies.length === 1 ? (currencies[0].expenseable_id ?? currencies[0].id) : 0), date: value?.date?.slice(0, 10) ?? format(new Date(), 'yyyy-MM-dd'), discount: Number(value?.discount ?? 0), final_total: Number(value?.final_total ?? 0), is_posted: Boolean(value?.is_posted), is_visible_to_client: value?.is_visible_to_client ?? true }); }, [currencies, form, modelType, open, value]);
  const itemRows = items.data?.data ?? []; const supplierRows = suppliers.data?.data ?? [];
  return <Dialog open={open} onOpenChange={(next) => !next && onClose()}><DialogContent className="!max-w-2xl"><DialogHeader><DialogTitle>{value ? 'تحديث المرتجع' : 'إنشاء مرتجع'}</DialogTitle></DialogHeader><form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
    <label className="space-y-1"><span>البند</span><SearchableSelect loading={items.isLoading} options={itemRows.map((row: any) => ({ value: row.id, label: row.name }))} value={form.watch('item_id')} onValueChange={(id) => form.setValue('item_id', Number(id))} placeholder="اختر البند" /></label>
    <label className="space-y-1"><span>المورد (اختياري)</span><SearchableSelect loading={suppliers.isLoading} options={supplierRows.map((row: any) => ({ value: row.id, label: row.user?.name ?? row.name }))} value={form.watch('supplier_id')} onValueChange={(id) => form.setValue('supplier_id', Number(id))} placeholder="اختر المورد" /></label>
    <label className="space-y-1"><span>عملة الصندوق</span><SearchableSelect options={currencies.map((row) => ({ value: row.expenseable_id ?? row.id, label: `${row.currency} ${row.symbol} — ${Number(row.balance).toLocaleString()}`, className: Number(row.balance) > 0 ? 'text-success' : 'text-destructive' }))} value={form.watch('reinvoiceable_id')} onValueChange={(id) => form.setValue('reinvoiceable_id', Number(id))} placeholder="اختر العملة" /></label>
    <label className="space-y-1"><span>التاريخ</span><Input type="date" {...form.register('date', { required: true })} /></label><label className="space-y-1"><span>الخصم</span><Input type="number" min={0} step="any" {...form.register('discount', { valueAsNumber: true })} /></label><label className="space-y-1"><span>الإجمالي</span><Input type="number" min={0} step="any" {...form.register('final_total', { required: true, valueAsNumber: true })} /></label>
    <div className="flex gap-5 sm:col-span-2"><label className="flex gap-2"><input type="checkbox" {...form.register('is_posted')} />مرحل</label>{modelType === 'App\\Models\\ProjectFundCurrency' && <label className="flex gap-2"><input type="checkbox" {...form.register('is_visible_to_client')} />مرئي للعميل</label>}</div>
    <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={onClose}>إلغاء</Button><Button type="submit" disabled={loading}>{loading ? 'جاري الحفظ...' : 'حفظ المرتجع'}</Button></div>
  </form></DialogContent></Dialog>;
}
