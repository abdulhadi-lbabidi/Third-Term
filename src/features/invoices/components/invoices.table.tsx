import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import { Badge } from '@/shared/components/ui/badge';
import { useInvoices, useDeleteInvoice } from '../invoices.hooks';
import { InvoiceDetailsDialog } from './invoice-details.dialog';
import { InvoicesDialog } from './invoices.dialog';
import type { Invoice } from '../types';
import { SimplePagination } from '@/components/ui/pagination';

type InvoicesTableProps = {
  filters?: Record<string, any>;
  fixedValues?: Record<string, any>;
  perPage?: number;
  editInDialog?: boolean;
  enabled?: boolean;
};

export function InvoicesTable({
  filters,
  fixedValues,
  perPage = 10,
  editInDialog = false,
  enabled = true,
}: InvoicesTableProps = {}) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(perPage);
  const filterKey = JSON.stringify({ filters, fixedValues, perPage });

  useEffect(() => {
    setPage(1);
    setLimit(perPage);
  }, [filterKey]);

  const { data: response, isLoading } = useInvoices({
    paginate: true,
    per_page: limit,
    page,
    ...filters,
    ...fixedValues,
  }, enabled);
  const { mutateAsync: deleteInvoice, isPending: isDeleting } = useDeleteInvoice();

  const [invoiceToViewId, setInvoiceToViewId] = useState<number | null>(null);
  const [invoiceToEditId, setInvoiceToEditId] = useState<number | null>(null);

  const invoices = response?.data || [];
  const meta = response?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  const columns: DataTableColumn<Invoice>[] = [
    {
      header: 'رقم الفاتورة',
      cell: (row: Invoice) => (
        <span className="font-medium text-slate-900">{row.invoice_number || `#${row.id}`}</span>
      ),
    },
    {
      header: 'التاريخ',
      cell: (row: Invoice) => (
        <span className="text-sm text-slate-600">
          {row.date ? format(new Date(row.date), 'yyyy-MM-dd') : '-'}
        </span>
      ),
    },
    {
      header: 'المورد',
      cell: (row: Invoice) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900">
            {typeof row.supplier === 'string' ? row.supplier : row.supplier?.name || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'البند',
      cell: (row: Invoice) => (
        <span className="text-sm text-slate-600">
          {typeof row.item === 'string' ? row.item : row.item?.name || '-'}
        </span>
      ),
    },
    {
      header: 'المصروف المرتبط',
      cell: (row: Invoice) => (
        <span className="text-sm text-slate-600">
          {row.expense_description || row.expense?.description || `#${row.expense_id || '-'}`}
        </span>
      ),
    },
    {
      header: 'الإجمالي',
      cell: (row: Invoice) => (
        <span className="font-semibold text-emerald-600">
          {Number(row.final_total).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'الحالة',
      cell: (row: Invoice) => (
        <Badge variant={row.is_posted ? 'default' : 'secondary'} className={row.is_posted ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}>
          {row.is_posted ? 'مرحل' : 'غير مرحل'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <DataTable
        columns={columns}
        data={invoices}
        loading={isLoading || isDeleting}
        emptyLabel="لا توجد فواتير"
        loadingLabel="جاري التحميل..."
        confirmTitle="حذف الفاتورة"
        confirmDescription="هل أنت متأكد من حذف الفاتورة؟ لا يمكن التراجع عن هذا الإجراء."
        cancelLabel="إلغاء"
        deleteLabel="حذف"
        actions={{
          onEdit: (row) => {
            if (editInDialog) setInvoiceToEditId(row.id);
            else navigate(`/invoices/new?invoiceId=${row.id}`);
          },
          editLabel: 'تحديث الفاتورة',
          onDelete: async (invoice) => {
            await deleteInvoice(invoice.id);
          },
          extraActions: [
            {
              label: 'عرض التفاصيل',
              icon: <Eye className="size-4" />,
              onClick: (row) => setInvoiceToViewId(row.id),
            }
          ]
        }}
      />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
        limit={limit}
        limitOptions={[5, 10, 25, 50]}
        onLimitChange={setLimit}
      />

      <InvoiceDetailsDialog
        isOpen={!!invoiceToViewId}
        onClose={() => setInvoiceToViewId(null)}
        invoiceId={invoiceToViewId}
      />

      <InvoicesDialog
        isOpen={!!invoiceToEditId}
        onClose={() => setInvoiceToEditId(null)}
        invoiceId={invoiceToEditId ?? undefined}
        fixedValues={fixedValues}
      />
    </div>
  );
}
