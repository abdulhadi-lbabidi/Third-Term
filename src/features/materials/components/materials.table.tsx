import dayjs from 'dayjs';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Material } from '../types';

type MaterialsTableProps = {
  data: Material[];
  loading?: boolean;
  onEdit?: (material: Material) => void;
  onDelete?: (material: Material) => void;
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
};

export function MaterialsTable({ data, loading, onEdit, onDelete, sort, onSortChange }: MaterialsTableProps) {
  const columns: DataTableColumn<Material>[] = [
    { header: 'البند', sortable: true, sortKey: 'item_name', cell: (material) => material.item?.name ?? material.item_id },
    { header: 'اسم المادة', sortable: true, sortKey: 'name', cell: (material) => material.name },
    { header: 'البيان', sortable: true, sortKey: 'description', cell: (material) => material.description ?? '-' },
    { header: 'تاريخ الإنشاء', sortable: true, sortKey: 'created_at', cell: (material) => (material.created_at ? dayjs(material.created_at).format('YYYY-MM-DD') : '-') },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد مواد"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذه المادة؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      sort={sort}
      onSortChange={onSortChange}
      actions={{ onEdit, onDelete }}
    />
  );
}
