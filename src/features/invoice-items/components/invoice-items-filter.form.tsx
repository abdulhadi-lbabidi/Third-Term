import { useQuery } from '@tanstack/react-query';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { materialsApi } from '@/features/materials/materials.api';
import { invoiceItemsApi } from '../invoice-items.api';

export type InvoiceItemsFilterFormProps = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  materialId: number | '';
  setMaterialId: (val: number | '') => void;
  invoiceId: number | '';
  setInvoiceId: (val: number | '') => void;
};

export function InvoiceItemsFilterForm({
  searchQuery,
  setSearchQuery,
  materialId,
  setMaterialId,
  invoiceId,
  setInvoiceId,
}: InvoiceItemsFilterFormProps) {
  const materialsQuery = useQuery({
    queryKey: ['filter-materials'] as const,
    queryFn: () => materialsApi.getMaterials(1, 1000),
  });

  const invoicesQuery = useQuery({
    queryKey: ['filter-invoices'] as const,
    queryFn: () => invoiceItemsApi.getInvoices(),
  });

  const materials = materialsQuery.data?.data ?? [];
  const invoices = invoicesQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="filter-search">البحث</Label>
        <Input
          id="filter-search"
          type="text"
          placeholder="البحث بوصف الصنف أو الوحدة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>المادة</Label>
        {materialsQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <SearchableSelect
            value={materialId || null}
            onValueChange={(val) => setMaterialId(val ? Number(val) : '')}
            placeholder="اختر المادة"
            searchPlaceholder="البحث عن مادة..."
            emptyMessage="لا توجد مواد."
            options={materials.map((m: any) => ({
              value: m.id,
              label: m.name || '-',
            }))}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label>الفاتورة</Label>
        {invoicesQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <SearchableSelect
            value={invoiceId || null}
            onValueChange={(val) => setInvoiceId(val ? Number(val) : '')}
            placeholder="اختر الفاتورة"
            searchPlaceholder="البحث عن فاتورة..."
            emptyMessage="لا توجد فواتير."
            options={invoices.map((i: any) => ({
              value: i.id,
              label: i.invoice_number || `#${i.id}`,
            }))}
          />
        )}
      </div>
    </div>
  );
}
