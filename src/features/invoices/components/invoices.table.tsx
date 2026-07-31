import { useState } from 'react';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import { Badge } from '@/shared/components/ui/badge';
import { useInvoices, useDeleteInvoice } from '../invoices.hooks';
import { InvoicesDialog } from './invoices.dialog';
import { InvoiceDetailsDialog } from './invoice-details.dialog';
import type { Invoice } from '../types';
import { SimplePagination } from '@/components/ui/pagination';

type InvoicesTableProps = {
  filters?: Record<string, any>;
  fixedValues?: Record<string, any>;
};

export function InvoicesTable({ filters, fixedValues }: InvoicesTableProps = {}) {
  const [page, setPage] = useState(1);
  const perPage = 50;

  const { data: response, isLoading } = useInvoices({ page, per_page: perPage, ...filters });
  const { mutateAsync: deleteInvoice, isPending: isDeleting } = useDeleteInvoice();

  const [invoiceToEditId, setInvoiceToEditId] = useState<number | null>(null);
  const [invoiceToViewId, setInvoiceToViewId] = useState<number | null>(null);

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
          onEdit: (row) => setInvoiceToEditId(row.id),
          onDelete: async (invoice) => {
            await deleteInvoice(invoice.id);
          },
          extraActions: [
            {
              label: 'عرض التفاصيل',
              icon: <Eye className="size-4" />,
              onClick: (row) => {
                console.log('View details', row);
              },
            }
          ]
        }}
      />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
      />

      <InvoicesDialog
        isOpen={!!invoiceToEditId}
        onClose={() => setInvoiceToEditId(null)}
        invoiceId={invoiceToEditId || undefined}
        fixedValues={fixedValues}
      />

      <InvoiceDetailsDialog
        isOpen={!!invoiceToViewId}
        onClose={() => setInvoiceToViewId(null)}
        invoiceId={invoiceToViewId}
      />
    </div>
  );
}
