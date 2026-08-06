import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { materialsApi } from '@/features/materials/materials.api';
import { reInvoicesApi } from '../re-invoices.api';

export function ReInvoiceItemsDialog({ id, onClose }: { id?: number; onClose: () => void }) {
  const client = useQueryClient(); const [materialId, setMaterialId] = useState(0); const [unit, setUnit] = useState(''); const [quantity, setQuantity] = useState(0); const [price, setPrice] = useState(0); const [description, setDescription] = useState('');
  const items = useQuery({ queryKey: ['re-invoice-items', id], queryFn: () => reInvoicesApi.getItems(id!), enabled: !!id });
  const materials = useQuery({ queryKey: ['re-invoice-items', 'materials'], queryFn: async () => (await materialsApi.getMaterials(1, 1000)).data, enabled: !!id });
  const save = useMutation({ mutationFn: () => reInvoicesApi.createItem({ reinvoice_id: id, material_id: materialId, unit, quantity, unit_price: price, item_description: description }), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['re-invoice-items', id] }); setMaterialId(0); setUnit(''); setQuantity(0); setPrice(0); setDescription(''); } });
  const remove = useMutation({ mutationFn: reInvoicesApi.deleteItem, onSuccess: async () => client.invalidateQueries({ queryKey: ['re-invoice-items', id] }) });
  const materialRows = materials.data ?? [];
  return <Dialog open={!!id} onOpenChange={(open) => !open && onClose()}><DialogContent className="!max-w-3xl !overflow-y-auto"><DialogHeader><DialogTitle>أصناف المرتجع</DialogTitle></DialogHeader>
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (materialId && quantity > 0) save.mutate(); }}>
      <label className="space-y-1"><span>المادة</span><SearchableSelect loading={materials.isLoading} options={materialRows.map((m) => ({ value: m.id, label: m.name }))} value={materialId || undefined} onValueChange={(value) => { const next = Number(value); setMaterialId(next); const material = materialRows.find((m) => m.id === next); if (material?.unit) setUnit(material.unit); }} placeholder="اختر المادة" /></label>
      <label className="space-y-1"><span>الوحدة</span><Input value={unit} onChange={(e) => setUnit(e.target.value)} /></label>
      <label className="space-y-1"><span>الكمية</span><Input type="number" min={0.01} step="any" value={quantity} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setQuantity(Number(e.target.value))} /></label>
      <label className="space-y-1"><span>سعر الوحدة</span><Input type="number" min={0} step="any" value={price} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setPrice(Number(e.target.value))} /></label>
      <label className="space-y-1 sm:col-span-2"><span>سبب المرتجع</span><Input value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      <div className="flex items-center justify-between sm:col-span-2"><strong className="finance-num">الإجمالي: {(quantity * price).toLocaleString()}</strong><Button type="submit" disabled={save.isPending}>إضافة صنف</Button></div>
    </form>
    <div className="max-h-60 divide-y overflow-y-auto rounded-lg border px-3">{(items.data ?? []).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium">{item.material?.name ?? `مادة #${item.material_id}`}</p><p className="text-xs text-muted-foreground">{item.quantity} {item.unit} × {Number(item.unit_price).toLocaleString()}</p></div><div className="flex items-center gap-2"><strong className="finance-num">{Number(item.total_price ?? item.quantity * item.unit_price).toLocaleString()}</strong><Button type="button" size="icon-sm" variant="ghost" className="text-destructive" onClick={() => remove.mutate(item.id)}><Trash2 className="size-4" /></Button></div></div>)}</div>
  </DialogContent></Dialog>;
}
