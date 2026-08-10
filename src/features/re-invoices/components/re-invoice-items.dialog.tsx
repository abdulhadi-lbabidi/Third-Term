import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { materialsApi } from '@/features/materials/materials.api';
import { reInvoicesApi } from '../re-invoices.api';
import type { ReInvoiceItem } from '../types';

export function ReInvoiceItemsDialog({
  id,
  onClose,
  onEdit,
  readOnly = false,
}: {
  id?: number;
  onClose: () => void;
  onEdit?: () => void;
  readOnly?: boolean;
}) {
  const client = useQueryClient();
  const [editingItem, setEditingItem] = useState<ReInvoiceItem | null>(null);
  const [materialId, setMaterialId] = useState(0);
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    material?: string;
    unit?: string;
    quantity?: string;
    description?: string;
  }>({});

  const details = useQuery({
    queryKey: ['re-invoices', 'details', id],
    queryFn: () => reInvoicesApi.getOne(id!),
    enabled: !!id && readOnly,
  });

  const items = useQuery({
    queryKey: ['re-invoice-items', id],
    queryFn: () => reInvoicesApi.getItems(id!),
    enabled: !!id,
  });

  const materials = useQuery({
    queryKey: ['re-invoice-items', 'materials'],
    queryFn: async () => (await materialsApi.getMaterials(1, 1000)).data,
    enabled: !!id && !readOnly,
  });

  const reset = () => {
    setEditingItem(null);
    setMaterialId(0);
    setUnit('');
    setQuantity(0);
    setPrice(0);
    setDescription('');
    setFieldErrors({});
  };

  const startEditing = (item: ReInvoiceItem) => {
    setEditingItem(item);
    setMaterialId(item.material_id ?? item.material?.id ?? 0);
    setUnit(item.unit);
    setQuantity(Number(item.quantity));
    setPrice(Number(item.unit_price));
    setDescription(item.item_description ?? '');
    setFieldErrors({});
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        reinvoice_id: id,
        material_id: materialId,
        unit: unit.trim(),
        quantity,
        unit_price: price,
        item_description: description.trim(),
      };
      return editingItem
        ? reInvoicesApi.updateItem(editingItem.id, payload)
        : reInvoicesApi.createItem(payload);
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['re-invoice-items', id] });
      reset();
    },
  });

  const remove = useMutation({
    mutationFn: reInvoicesApi.deleteItem,
    onSuccess: async () => client.invalidateQueries({ queryKey: ['re-invoice-items', id] }),
  });

  const materialRows = materials.data ?? [];
  const reInvoice = details.data;
  const supplierName =
    typeof reInvoice?.supplier === 'string'
      ? reInvoice.supplier
      : reInvoice?.supplier?.user?.name ?? reInvoice?.supplier?.name;
  const itemName =
    typeof reInvoice?.item === 'string' ? reInvoice.item : reInvoice?.item?.name;
  const fundInfo = reInvoice?.reinvoiceable_info;
  const currency = fundInfo?.details?.currency;
  const projectName = fundInfo?.project_info?.name ?? fundInfo?.project_info?.project?.name;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = {
      ...(!materialId ? { material: 'المادة مطلوبة' } : {}),
      ...(!unit.trim() ? { unit: 'الوحدة مطلوبة' } : {}),
      ...(!Number.isFinite(quantity) || quantity <= 0
        ? { quantity: 'الكمية يجب أن تكون أكبر من صفر' }
        : {}),
      ...(!description.trim() ? { description: 'سبب المرتجع مطلوب' } : {}),
    };
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    save.mutate();
  };

  return (
    <Dialog open={!!id} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!max-w-3xl !overflow-y-auto">
        <DialogHeader className="flex-row items-center justify-between gap-3">
          <DialogTitle>{readOnly ? 'عرض المرتجع' : 'أصناف المرتجع'}</DialogTitle>
          {readOnly && onEdit && (
            <Button type="button" size="sm" onClick={onEdit}>
              <Pencil className="size-4" />
              تعديل المرتجع
            </Button>
          )}
        </DialogHeader>

        {/* Read-only details view */}
        {readOnly && details.isLoading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            جاري تحميل بيانات المرتجع...
          </p>
        )}
        {readOnly && details.isError && (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            تعذر تحميل بيانات المرتجع.
          </p>
        )}
        {readOnly && reInvoice && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-4">
              <div>
                <p className="text-xs text-muted-foreground">رقم المرتجع</p>
                <p className="font-semibold">
                  {reInvoice.reinvoice_number ?? reInvoice.invoice_number ?? `#${reInvoice.id}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant={reInvoice.is_posted ? 'default' : 'secondary'}>
                  {reInvoice.is_posted ? 'مرحّل' : 'غير مرحّل'}
                </Badge>
                {reInvoice.is_visible_to_client && (
                  <Badge variant="outline">مرئي للعميل</Badge>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">البند</p>
                <p className="mt-1 font-medium">{itemName ?? '-'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">المزوّد</p>
                <p className="mt-1 font-medium">{supplierName ?? 'بدون مزوّد'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">المشروع / الصندوق</p>
                <p className="mt-1 font-medium">{projectName ?? fundInfo?.type ?? '-'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">العملة والرصيد</p>
                <p className="mt-1 font-medium">
                  {currency ? `${currency.currency} ${currency.symbol}` : '-'}
                  {fundInfo?.details?.balance != null
                    ? ` — ${Number(fundInfo.details.balance).toLocaleString()}`
                    : ''}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">التاريخ</p>
                <p className="mt-1 font-medium">{reInvoice.date ?? '-'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">الإجمالي / الخصم</p>
                <p className="finance-num mt-1 font-medium">
                  {Number(reInvoice.final_total).toLocaleString()} /{' '}
                  {Number(reInvoice.discount ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            <h3 className="font-semibold">أصناف المرتجع</h3>
          </div>
        )}

        {/* Add / Edit item form */}
        {!readOnly && (
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
            <label className="space-y-1">
              <span>المادة</span>
              <SearchableSelect
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
                className={fieldErrors.material ? 'border-destructive' : undefined}
              />
              {fieldErrors.material && (
                <p className="text-sm text-destructive">{fieldErrors.material}</p>
              )}
            </label>

            <label className="space-y-1">
              <span>الوحدة</span>
              <Input
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  setFieldErrors((errors) => ({ ...errors, unit: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.unit)}
              />
              {fieldErrors.unit && (
                <p className="text-sm text-destructive">{fieldErrors.unit}</p>
              )}
            </label>

            <label className="space-y-1">
              <span>الكمية</span>
              <Input
                type="number"
                min={0.01}
                step="any"
                value={quantity}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => {
                  setQuantity(Number(e.target.value));
                  setFieldErrors((errors) => ({ ...errors, quantity: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.quantity)}
              />
              {fieldErrors.quantity && (
                <p className="text-sm text-destructive">{fieldErrors.quantity}</p>
              )}
            </label>

            <label className="space-y-1">
              <span>سعر الوحدة</span>
              <Input
                type="number"
                min={0}
                step="any"
                value={price}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span>سبب المرتجع</span>
              <Input
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setFieldErrors((errors) => ({ ...errors, description: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.description)}
              />
              {fieldErrors.description && (
                <p className="text-sm text-destructive">{fieldErrors.description}</p>
              )}
            </label>

            <div className="flex items-center justify-between sm:col-span-2">
              <strong className="finance-num">
                الإجمالي: {(quantity * price).toLocaleString()}
              </strong>
              <div className="flex items-center gap-2">
                {editingItem && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={reset}
                    disabled={save.isPending}
                  >
                    <X className="size-4" />
                    إلغاء
                  </Button>
                )}
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? 'جاري الحفظ...' : editingItem ? 'حفظ التعديلات' : 'إضافة صنف'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Items list */}
        <div className="max-h-60 divide-y overflow-y-auto rounded-lg border px-3">
          {items.isLoading && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              جاري تحميل الأصناف...
            </p>
          )}
          {!items.isLoading && !(items.data ?? []).length && (
            <p className="py-6 text-center text-sm text-muted-foreground">لا توجد أصناف مضافة.</p>
          )}
          {(items.data ?? []).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{item.material?.name ?? `مادة #${item.material_id}`}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} {item.unit} × {Number(item.unit_price).toLocaleString()}
                </p>
                {item.item_description && (
                  <p className="mt-1 text-xs text-muted-foreground">{item.item_description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <strong className="finance-num">
                  {Number(item.total_price ?? item.quantity * item.unit_price).toLocaleString()}
                </strong>
                {!readOnly && (
                  <>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      title="تعديل الصنف"
                      onClick={() => startEditing(item)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => remove.mutate(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
