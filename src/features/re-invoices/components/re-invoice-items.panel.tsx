import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { materialsApi } from '@/features/materials/materials.api';
import { reInvoicesApi } from '../re-invoices.api';
import type { ReInvoiceItem } from '../types';

export function ReInvoiceItemsPanel({ reInvoiceId, onBack, onDone, sourceInvoiceItems, disablePrefilledFields }: { reInvoiceId: number; onBack?: () => void; onDone?: () => void; sourceInvoiceItems?: any[]; disablePrefilledFields?: boolean }) {
  const client = useQueryClient();
  const [editingItem, setEditingItem] = useState<ReInvoiceItem | null>(null);
  const [materialId, setMaterialId] = useState(0); const [unit, setUnit] = useState(''); const [quantity, setQuantity] = useState(0); const [price, setPrice] = useState(0); const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ material?: string; unit?: string; quantity?: string; description?: string }>({});
  const items = useQuery({ queryKey: ['re-invoice-items', reInvoiceId], queryFn: () => reInvoicesApi.getItems(reInvoiceId) });
  const materials = useQuery({ queryKey: ['re-invoice-items', 'materials'], queryFn: async () => (await materialsApi.getMaterials(1, 1000)).data });
  const reset = () => { setEditingItem(null); setMaterialId(0); setUnit(''); setQuantity(0); setPrice(0); setDescription(''); setFieldErrors({}); };
  const startEditing = (item: ReInvoiceItem) => { setEditingItem(item); setMaterialId(item.material_id ?? item.material?.id ?? 0); setUnit(item.unit); setQuantity(Number(item.quantity)); setPrice(Number(item.unit_price)); setDescription(item.item_description ?? ''); setFieldErrors({}); };
  const save = useMutation({ mutationFn: () => { const payload = { reinvoice_id: reInvoiceId, material_id: materialId, unit: unit.trim(), quantity, unit_price: price, item_description: description.trim() }; return editingItem ? reInvoicesApi.updateItem(editingItem.id, payload) : reInvoicesApi.createItem(payload); }, onSuccess: async () => { await client.invalidateQueries({ queryKey: ['re-invoice-items', reInvoiceId] }); reset(); } });
  const remove = useMutation({ mutationFn: reInvoicesApi.deleteItem, onSuccess: async () => client.invalidateQueries({ queryKey: ['re-invoice-items', reInvoiceId] }) });
  const materialRows = materials.data ?? [];

  useEffect(() => {
    if (sourceInvoiceItems && sourceInvoiceItems.length > 0 && !materialId && !editingItem) {
      const first = sourceInvoiceItems[0];
      const mId = Number(first.material_id ?? first.material?.id ?? 0);
      setMaterialId(mId);
      setUnit(first.unit ?? '');
      setQuantity(Number(first.quantity ?? 1));
      setPrice(Number(first.unit_price ?? 0));
      setDescription(first.item_description || `إرجاع ${first.material?.name ?? ''}`);
    }
  }, [sourceInvoiceItems, materialId, editingItem]);

  return (
    <div className="space-y-4">
      {sourceInvoiceItems && sourceInvoiceItems.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">أصناف الفاتورة الأصلية (تعبئة سريعة):</p>
          <div className="flex flex-wrap gap-2">
            {sourceInvoiceItems.map((invItem) => {
              const matName = invItem.material?.name ?? `مادة #${invItem.material_id}`;
              return (
                <Button
                  key={invItem.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const mId = Number(invItem.material_id ?? invItem.material?.id ?? 0);
                    setMaterialId(mId);
                    setUnit(invItem.unit ?? '');
                    setQuantity(Number(invItem.quantity ?? 1));
                    setPrice(Number(invItem.unit_price ?? 0));
                    setDescription(invItem.item_description || `إرجاع ${matName}`);
                    setFieldErrors({});
                  }}
                >
                  {matName} ({invItem.quantity} {invItem.unit} × {Number(invItem.unit_price).toLocaleString()})
                </Button>
              );
            })}
          </div>
        </div>
      )}
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => {
        e.preventDefault();
        const errors = {
          ...(!materialId ? { material: 'المادة مطلوبة' } : {}),
          ...(!unit.trim() ? { unit: 'الوحدة مطلوبة' } : {}),
          ...(!Number.isFinite(quantity) || quantity <= 0 ? { quantity: 'الكمية يجب أن تكون أكبر من صفر' } : {}),
          ...(!description.trim() ? { description: 'سبب المرتجع مطلوب' } : {}),
        };
        setFieldErrors(errors);
        if (Object.keys(errors).length) return;
        save.mutate();
      }}>
        <label className="space-y-1">
          <span>المادة</span>
          <SearchableSelect
            disabled={disablePrefilledFields && !editingItem}
            loading={materials.isLoading}
            options={materialRows.map((m) => ({ value: m.id, label: m.name }))}
            value={materialId || undefined}
            onValueChange={(value) => {
              const next = Number(value);
              setMaterialId(next);
              setFieldErrors((errors) => ({ ...errors, material: undefined }));
              const material = materialRows.find((m) => m.id === next);
              if (material?.unit) {
                setUnit(material.unit);
                setFieldErrors((errors) => ({ ...errors, unit: undefined }));
              }
            }}
            placeholder="اختر المادة"
            className={fieldErrors.material ? 'border-destructive' : undefined} />
          {fieldErrors.material && <p className="text-sm text-destructive">{fieldErrors.material}</p>}
        </label>
        <label className="space-y-1">
          <span>الوحدة</span>
          <Input disabled={disablePrefilledFields && !editingItem} value={unit} onChange={(e) => { setUnit(e.target.value); setFieldErrors((errors) => ({ ...errors, unit: undefined })); }} aria-invalid={Boolean(fieldErrors.unit)} />
          {fieldErrors.unit && <p className="text-sm text-destructive">{fieldErrors.unit}</p>}
        </label>
        <label className="space-y-1">
          <span>الكمية</span>
          <Input type="number" min={1} step="any" value={quantity} onFocus={(e) => e.currentTarget.select()} onChange={(e) => { setQuantity(Number(e.target.value)); setFieldErrors((errors) => ({ ...errors, quantity: undefined })); }} aria-invalid={Boolean(fieldErrors.quantity)} />
          {fieldErrors.quantity && <p className="text-sm text-destructive">{fieldErrors.quantity}</p>}
        </label>
        <label className="space-y-1">
          <span>سعر الوحدة</span>
          <Input type="number" min={0} step="any" disabled={disablePrefilledFields && !editingItem} value={price} onFocus={(e) => e.currentTarget.select()} onChange={(e) => setPrice(Number(e.target.value))} />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span>سبب المرتجع</span>
          <Input disabled={disablePrefilledFields && !editingItem} value={description} onChange={(e) => { setDescription(e.target.value); setFieldErrors((errors) => ({ ...errors, description: undefined })); }} aria-invalid={Boolean(fieldErrors.description)} />
          {fieldErrors.description && <p className="text-sm text-destructive">{fieldErrors.description}</p>}
        </label>
        <div className="flex items-center justify-between sm:col-span-2">
          <strong className="finance-num">الإجمالي: {(quantity * price).toLocaleString()}</strong>
          <div className="flex items-center gap-2">
            {editingItem && <Button type="button" size="sm" variant="outline" onClick={reset} disabled={save.isPending}><X className="size-4" />إلغاء</Button>}
            <Button type="submit" size="sm" disabled={save.isPending}>{save.isPending ? 'جاري الحفظ...' : editingItem ? 'حفظ التعديلات' : 'إضافة صنف'}</Button>
          </div>
        </div>
      </form>
      <div className="max-h-52 divide-y overflow-y-auto rounded-lg border px-3">
        {(items.data ?? []).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{item.material?.name ?? `مادة #${item.material_id}`}</p>
            <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} × {Number(item.unit_price).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <strong className="finance-num">{Number(item.total_price ?? item.quantity * item.unit_price).toLocaleString()}</strong>
            <Button type="button" size="icon-sm" variant="ghost" title="تعديل الصنف" onClick={() => startEditing(item)}><Pencil className="size-4" /></Button>
            <Button type="button" size="icon-sm" variant="ghost" className="text-destructive" onClick={() => remove.mutate(item.id)}><Trash2 className="size-4" /></Button>
          </div>
        </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={onBack}>العودة إلى البيانات</Button>
        <Button type="button" onClick={onDone} disabled={!items.data?.length}>إنهاء</Button>
      </div>
    </div>
  )
}
