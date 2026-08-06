// removed unused import
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Item } from '../types';
import dayjs from 'dayjs';
import { Badge } from '@/shared/components/ui/badge';
import { Package } from 'lucide-react';

type ItemsTableProps = {
  data: Item[];
  loading?: boolean;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  onShowMaterials?: (item: Item) => void;
};

export function ItemsTable({ data, loading, onEdit, onDelete, onShowMaterials }: ItemsTableProps) {
  const columns: DataTableColumn<Item>[] = [
    { header: 'اسم البند', cell: (item) => item.name },
    { header: 'الوصف', cell: (item) => item.description },
    {
      header: 'عدد المواد',
      cell: (item) => {
        const count = item.materials?.length ?? 0;
        return (
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors"
            onClick={() => onShowMaterials?.(item)}
          >
            {count}
          </Badge>
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
        extraActions: onShowMaterials
          ? [
              {
                label: 'المواد التابعة',
                icon: <Package className="size-4" />,
                onClick: onShowMaterials,
              },
            ]
          : undefined,
      }}
    />
  );
}
