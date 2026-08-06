import { PackageOpen } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { ReInvoice } from '../types';

export function ReInvoicesTable({ data, loading, onDelete, onItems, onEdit }: { data: ReInvoice[]; loading?: boolean; onDelete: (row: ReInvoice) => Promise<void>; onItems: (row: ReInvoice) => void; onEdit?: (row: ReInvoice) => void }) {
  const columns: DataTableColumn<ReInvoice>[] = [
    { header: 'المرتجع', cell: (row) => row.invoice_number ?? `#${row.id}` },
    { header: 'التاريخ', cell: (row) => row.date?.slice(0, 10) ?? '-' },
    { header: 'البند', cell: (row) => typeof row.item === 'string' ? row.item : row.item?.name ?? `#${row.item_id}` },
    { header: 'الإجمالي', cell: (row) => <span className="finance-num font-semibold text-success">{Number(row.final_total).toLocaleString()}</span> },
    { header: 'الحالة', cell: (row) => <Badge variant={row.is_posted ? 'default' : 'secondary'}>{row.is_posted ? 'مرحل' : 'غير مرحل'}</Badge> },
  ];
  return <DataTable columns={columns} data={data} loading={loading} emptyLabel="لا توجد مرتجعات" loadingLabel="جاري التحميل..." confirmTitle="حذف المرتجع" confirmDescription="هل تريد حذف هذا المرتجع؟ لا يمكن التراجع عن هذا الإجراء." cancelLabel="إلغاء" deleteLabel="حذف" actions={{ onEdit, editLabel: 'تعديل المرتجع', onDelete, extraActions: [{ label: 'إدارة الأصناف', icon: <PackageOpen className="size-4" />, onClick: onItems }] }} />;
}
