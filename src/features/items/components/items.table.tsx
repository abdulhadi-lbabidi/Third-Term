// removed unused import
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Item } from '../types';
import dayjs from 'dayjs';

type ItemsTableProps = {
  data: Item[];
  loading?: boolean;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
};

export function ItemsTable({ data, loading, onEdit, onDelete }: ItemsTableProps) {
  const columns: DataTableColumn<Item>[] = [
    { header: 'اسم البند', cell: (item) => item.name },
    { header: 'الوصف', cell: (item) => item.description },
    {
      header: 'المواد',
      cell: (item) => {
        const materials = item.materials ?? [];

        if (!materials.length) {
          return <span className="text-slate-500">-</span>;
        }

        return (
          <div className="flex flex-wrap gap-2">
            {materials.map((material) => (
              <span
                key={material.id}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {material.name}
              </span>
            ))}
          </div>
        );
      },
    },
    { header: 'تاريخ الإنشاء', cell: (item) => (item.created_at ? dayjs(item.created_at).format('YYYY-MM-DD') : '-') },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد بنود"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذا البند؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      actions={{
        onEdit,
        onDelete,
      }}
    />
  );
}
