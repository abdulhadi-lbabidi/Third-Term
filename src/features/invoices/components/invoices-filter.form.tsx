import { useQuery } from '@tanstack/react-query';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { expensesApi } from '@/features/expenses/expenses.api';
import { usersApi } from '@/features/users/api/users.api';
import { itemsApi } from '@/features/items/items.api';

export type InvoicesFilterFormProps = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  expenseId: number | '';
  setExpenseId: (val: number | '') => void;
  supplierId: number | '';
  setSupplierId: (val: number | '') => void;
  itemId: number | '';
  setItemId: (val: number | '') => void;
};

export function InvoicesFilterForm({
  searchQuery,
  setSearchQuery,
  expenseId,
  setExpenseId,
  supplierId,
  setSupplierId,
  itemId,
  setItemId,
}: InvoicesFilterFormProps) {
  const expensesQuery = useQuery({
    queryKey: ['filter-expenses'] as const,
    queryFn: () => expensesApi.getExpenses(1, 1000),
  });

  const suppliersQuery = useQuery({
    queryKey: ['filter-suppliers'] as const,
    queryFn: () => usersApi.getUsersByRole('supplier', 1, 1000),
  });

  const itemsQuery = useQuery({
    queryKey: ['filter-items'] as const,
    queryFn: () => itemsApi.getItems(1, 1000),
  });

  const expenses = expensesQuery.data?.data ?? [];
  const suppliers = suppliersQuery.data?.data ?? [];
  const items = itemsQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="filter-search">البحث</Label>
        <Input
          id="filter-search"
          type="text"
          placeholder="البحث برقم الفاتورة أو اسم المورد..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>المصروف المرتبط</Label>
        {expensesQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <SearchableSelect
            value={expenseId || null}
            onValueChange={(val) => setExpenseId(val ? Number(val) : '')}
            placeholder="اختر المصروف"
            searchPlaceholder="البحث عن مصروف..."
            emptyMessage="لا توجد مصروفات."
            options={expenses.map((e: any) => ({
              value: e.id,
              label: e.description || `#${e.id}`,
            }))}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label>المورد</Label>
        {suppliersQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <SearchableSelect
            value={supplierId || null}
            onValueChange={(val) => setSupplierId(val ? Number(val) : '')}
            placeholder="اختر المورد"
            searchPlaceholder="البحث عن مورد..."
            emptyMessage="لا يوجد موردون."
            options={suppliers.map((s: any) => ({
              value: s.id,
              label: s.user?.name || '-',
            }))}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label>الصنف (البند)</Label>
        {itemsQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <SearchableSelect
            value={itemId || null}
            onValueChange={(val) => setItemId(val ? Number(val) : '')}
            placeholder="اختر الصنف"
            searchPlaceholder="البحث عن صنف..."
            emptyMessage="لا توجد أصناف."
            options={items.map((i: any) => ({
              value: i.id,
              label: i.name || '-',
            }))}
          />
        )}
      </div>
    </div>
  );
}
