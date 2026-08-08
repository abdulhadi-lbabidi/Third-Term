import dayjs from 'dayjs';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { InvoiceItem } from '../types';

type InvoiceItemsTableProps = {
  data: InvoiceItem[];
  loading?: boolean;
  onEdit?: (item: InvoiceItem) => void;
  onDelete?: (item: InvoiceItem) => void;
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
};

function formatMoney(value?: number) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return Number(value).toFixed(2);
}

export function InvoiceItemsTable({ data, loading, onEdit, onDelete, sort, onSortChange }: InvoiceItemsTableProps) {
  const columns: DataTableColumn<InvoiceItem>[] = [
    {
      header: 'رقم الفاتورة',
      cell: (row) => row.invoice?.invoice_number ?? row.invoice_id ?? '-',
    },
    {
      header: 'المادة',
      sortable: true,
      sortKey: 'material_name',
      cell: (row) => row.material?.name ?? row.material_id ?? '-',
    },
    {
      header: 'وصف الصنف',
      sortable: true,
      sortKey: 'item_description',
      cell: (row) => row.item_description || '-',
    },
    { header: 'الوحدة', sortable: true, sortKey: 'unit', cell: (row) => row.unit || '-' },
    {
      header: 'الكمية',
      sortable: true,
      sortKey: 'quantity',
      cell: (row) => <span className="finance-num">{row.quantity}</span>,
    },
    {
      header: 'سعر الوحدة',
      sortable: true,
      sortKey: 'unit_price',
      cell: (row) => <span className="finance-num">{formatMoney(row.unit_price)}</span>,
    },
    {
      header: 'الإجمالي',
      cell: (row) => (
        <span className="finance-num font-medium">{formatMoney(row.total_price)}</span>
      ),
    },
    {
      header: 'تاريخ الإنشاء',
      sortable: true,
      sortKey: 'created_at',
      cell: (row) => (row.created_at ? dayjs(row.created_at).format('YYYY-MM-DD') : '-'),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد أصناف فاتورة"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      sort={sort}
      onSortChange={onSortChange}
      actions={{ onEdit, onDelete }}
    />
  );
}
