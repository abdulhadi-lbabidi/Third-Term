import dayjs from 'dayjs';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { Material } from '../types';

type MaterialsTableProps = {
  data: Material[];
  loading?: boolean;
  onEdit?: (material: Material) => void;
  onDelete?: (material: Material) => void;
};

export function MaterialsTable({ data, loading, onEdit, onDelete }: MaterialsTableProps) {
  const columns: DataTableColumn<Material>[] = [
    { header: 'البند', cell: (material) => material.item?.name ?? material.item_id },
    { header: 'اسم المادة', cell: (material) => material.name },
    { header: 'البيان', cell: (material) => material.description ?? '-' },
    { header: 'تاريخ الإنشاء', cell: (material) => (material.created_at ? dayjs(material.created_at).format('YYYY-MM-DD') : '-') },
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
      actions={{ onEdit, onDelete }}
    />
  );
}
