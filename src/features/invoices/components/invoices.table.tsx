import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import { Badge } from '@/shared/components/ui/badge';
import { useInvoices, useDeleteInvoice } from '../invoices.hooks';
import { InvoiceDetailsDialog } from './invoice-details.dialog';
import { InvoicesDialog } from './invoices.dialog';
import type { Invoice } from '../types';
import { SimplePagination } from '@/components/ui/pagination';
import { Checkbox } from '@/shared/components/ui/checkbox';

type InvoicesTableProps = {
  filters?: Record<string, any>;
  fixedValues?: Record<string, any>;
  perPage?: number;
  enabled?: boolean;
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
  showSelection?: boolean;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
};

export function InvoicesTable({
  filters,
  fixedValues,
  perPage = 10,
  enabled = true,
  sort,
  onSortChange,
  showSelection = false,
  selectedIds = [],
  onSelectionChange,
}: InvoicesTableProps = {}) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(perPage);
  const filterKey = JSON.stringify({ filters, fixedValues, perPage });

  useEffect(() => {
    setPage(1);
    setLimit(perPage);
  }, [filterKey, perPage]);

  const { data: response, isLoading } = useInvoices({
    paginate: true,
    per_page: limit,
    page,
    sort,
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

  const isAllSelected = invoices.length > 0 && invoices.every((row) => selectedIds.includes(row.id));

  const selectionColumn: DataTableColumn<Invoice> = {
    header: (
      <Checkbox
        checked={isAllSelected}
        onCheckedChange={(checked) => {
          if (checked) {
            const pageIds = invoices.map((row) => row.id);
            const nextSelected = [...selectedIds];
            pageIds.forEach((id) => {
              if (!nextSelected.includes(id)) {
                nextSelected.push(id);
              }
            });
            onSelectionChange?.(nextSelected);
          } else {
            const pageIds = invoices.map((row) => row.id);
            onSelectionChange?.(selectedIds.filter((id) => !pageIds.includes(id)));
          }
        }}
      />
    ),
    cell: (row: Invoice) => (
      <Checkbox
        checked={selectedIds.includes(row.id)}
        onCheckedChange={(checked) => {
          if (checked) {
            onSelectionChange?.([...selectedIds, row.id]);
          } else {
            onSelectionChange?.(selectedIds.filter((id) => id !== row.id));
          }
        }}
      />
    ),
    className: 'w-10 px-2',
  };

  const columns: DataTableColumn<Invoice>[] = [
    ...(showSelection ? [selectionColumn] : []),
    {
      header: 'رقم الفاتورة',
      sortable: true,
      sortKey: 'invoice_number',
      cell: (row: Invoice) => (
        <span className="font-medium text-slate-900">{row.invoice_number || `#${row.id}`}</span>
      ),
    },
    {
      header: 'التاريخ',
      sortable: true,
      sortKey: 'created_at',
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
      sortable: true,
      sortKey: 'is_posted',
      cell: (row: Invoice) => (
        <Badge variant={row.is_posted ? 'default' : 'secondary'} className={row.is_posted ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : ''}>
          {row.is_posted ? 'مرحل' : 'غير مرحل'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex min-w-0 flex-1 flex-col space-y-3 sm:space-y-4">
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
        sort={sort}
        onSortChange={onSortChange}
        actions={{
          onEdit: (row) => {
            setInvoiceToEditId(row.id);
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
