import { useNavigate } from 'react-router-dom';
import { Badge } from '@/shared/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { ReInvoice } from '../types';

export function ReInvoicesTable({ data, loading, onDelete, onView: _onView, onEdit, sort, onSortChange, disableScroll }: { data: ReInvoice[]; loading?: boolean; onDelete?: (row: ReInvoice) => Promise<void>; onView: (row: ReInvoice) => void; onEdit?: (row: ReInvoice) => void; sort?: string; onSortChange?: (sort: string | undefined) => void; disableScroll?: boolean }) {
  const navigate = useNavigate();
  const columns: DataTableColumn<ReInvoice>[] = [
    { header: 'ID', sortable: true, sortKey: 'id', cell: (row) => <span className="finance-num">#{row.id}</span> },
    { header: 'المرتجع', sortable: true, sortKey: 'reinvoice_number', cell: (row) => row.reinvoice_number ?? row.invoice_number ?? `#${row.id}` },
    { header: 'التاريخ', sortable: true, sortKey: 'date', cell: (row) => row.date?.slice(0, 10) ?? '-' },
    { header: 'البند', sortable: true, sortKey: 'item_name', cell: (row) => typeof row.item === 'string' ? row.item : row.item?.name ?? `#${row.item_id}` },
    { header: 'المزوّد', sortable: true, sortKey: 'supplier_name', cell: (row) => typeof row.supplier === 'string' ? row.supplier : row.supplier?.user?.name ?? row.supplier?.name ?? '-' },
    { header: 'الإجمالي', sortable: true, sortKey: 'final_total', cell: (row) => <span className="finance-num font-semibold text-success">{Number(row.final_total).toLocaleString()}</span> },
    { header: 'الترحيل', sortable: true, sortKey: 'is_posted', cell: (row) => <Badge variant={row.is_posted ? 'default' : 'secondary'}>{row.is_posted ? 'مرحل' : 'غير مرحل'}</Badge> },
    { header: 'للعميل', sortable: true, sortKey: 'is_visible_to_client', cell: (row) => <Badge variant={row.is_visible_to_client ? 'outline' : 'secondary'}>{row.is_visible_to_client ? 'مرئي' : 'غير مرئي'}</Badge> },
    { header: 'تاريخ الإنشاء', sortable: true, sortKey: 'created_at', cell: (row) => row.created_at?.slice(0, 10) ?? '-' },
  ];
  return <DataTable columns={columns} data={data} loading={loading} emptyLabel="لا توجد مرتجعات" loadingLabel="جاري التحميل..." confirmTitle="حذف المرتجع" confirmDescription="هل تريد حذف هذا المرتجع؟ لا يمكن التراجع عن هذا الإجراء." cancelLabel="إلغاء" deleteLabel="حذف" sort={sort} onSortChange={onSortChange} onRowClick={(row) => navigate(`/re-invoices/${row.id}`)} disableScroll={disableScroll} actions={{ onView: (row) => navigate(`/re-invoices/${row.id}`), viewLabel: 'عرض المرتجع', onEdit, editLabel: 'تعديل المرتجع', onDelete }} />;
}
