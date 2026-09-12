import { useNavigate } from 'react-router-dom';
import { AlertCircle, CreditCard, Eye, FilePlus2, HandCoins, Loader2, ReceiptText } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import {
  getBooleanLabel,
  getCurrencyStringFromInfo,
  UserLink,
  FundLink,
  type TableUser
} from '@/features/components/table-helpers';
import { formatArabicDate } from '@/shared/lib/utils';
import type { Expense } from '../types';

type ExpenseRow = Expense & {
  user?: TableUser;
  created_by?: TableUser;
};

type ExpensesTableProps = {
  data: Expense[];
  loading?: boolean;
  onView?: (expense: Expense) => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
  onInvoices?: (expense: Expense) => void;
  onAddInvoice?: (expense: Expense) => void;
  onPayments?: (expense: Expense) => void;
  onSettlePayment?: (expense: Expense) => void;
  invoiceCountsByExpenseId?: Map<number, number>;
  invoicesLoading?: boolean;
  invoicesError?: boolean;
  hideTypeColumn?: boolean;
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
  disableScroll?: boolean;
};

export function ExpensesTable({
  data,
  loading,
  onView,
  onEdit,
  onDelete,
  onInvoices,
  onAddInvoice,
  onPayments,
  onSettlePayment,
  invoiceCountsByExpenseId,
  invoicesLoading,
  invoicesError,
  hideTypeColumn,
  sort,
  onSortChange,
  disableScroll,
}: ExpensesTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (row: Expense) => {
    navigate(`/expenses/${row.id}`);
  };

  const allColumns: DataTableColumn<Expense>[] = [
    { header: 'رقم السند', cell: (row) => row.voucher_number || '-' },
    { header: 'البيان', cell: (row) => row.description },
    {
      header: 'المبلغ',
      sortable: true,
      sortKey: 'amount',
      cell: (row) => {
        const amount = Number(row.amount || 0).toLocaleString();
        const currency = getCurrencyStringFromInfo(row.expenseable_info);
        return (
          <div className="flex items-center justify-center gap-1">
            <span className="finance-num font-medium">{amount}</span>
            {currency ? <span className="text-xs text-muted-foreground">{currency}</span> : null}
          </div>
        );
      }
    },
    { header: 'المستلم بيد', cell: (row) => row.note ?? '-' },
    { header: 'نوع الصرف', cell: (row) => <FundLink type={row.expenseable_type} info={row.expenseable_info} fundTab="expenses" fallbackUser={(row as ExpenseRow).user} /> },
    {
      header: 'تم الترحيل',
      sortable: true,
      sortKey: 'is_posted',
      cell: (row) => (
        <span className={row.is_posted ? 'status-badge-success' : 'status-badge-danger'}>
          {getBooleanLabel(row.is_posted)}
        </span>
      ),
    },
    { header: 'أنشئ بواسطة', sortable: true, sortKey: 'creator_name', cell: (row) => <UserLink user={(row as ExpenseRow).created_by} /> },
    {
      header: 'عدد الفواتير',
      cell: (row: Expense) => {
        if (invoicesLoading) return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
        if (invoicesError) return <span title="تعذر التحقق"><AlertCircle className="size-4 text-destructive" /></span>;
        const count = row.invoices_count ?? invoiceCountsByExpenseId?.get(row.id) ?? 0;
        return <Badge variant="secondary">{count}</Badge>;
      },
    },
    // { header: 'المعرف', cell: (row) => String(row.expenseable_id ?? '-') },
    { header: 'تاريخ الإنشاء', sortable: true, sortKey: 'created_at', cell: (row) => row.created_at ? formatArabicDate(row.created_at) : '-' },
  ];

  const columns = hideTypeColumn ? allColumns.filter((c) => c.header !== 'نوع الصرف') : allColumns;

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا توجد مصروفات"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      sort={sort}
      onSortChange={onSortChange}
      onRowClick={handleRowClick}
      disableScroll={disableScroll}
      actions={{
        onEdit,
        onDelete,
        onView: (row) => navigate(`/expenses/${row.id}`),
        extraActions: [
          ...(onView
            ? [
              {
                label: 'تفاصيل المصروف',
                icon: <Eye className="size-4" />,
                onClick: onView,
              },
            ]
            : []),
          ...(onPayments
            ? [
              {
                label: 'الدفعات',
                icon: <CreditCard className="size-4" />,
                onClick: onPayments,
              },
            ]
            : []),
          ...(onSettlePayment
            ? [
              {
                label: 'تسديد الدفعة',
                icon: <HandCoins className="size-4" />,
                onClick: onSettlePayment,
              },
            ]
            : []),
          ...(onInvoices
            ? [{
              label: (row: Expense) => {
                if (invoicesLoading) return 'جاري التحقق من الفواتير...';
                if (invoicesError) return 'إعادة التحقق من الفواتير';
                const count = row.invoices_count ?? invoiceCountsByExpenseId?.get(row.id) ?? 0;
                return `عرض الفواتير (${count})`;
              },
              icon: (row: Expense) => {
                row
                return <ReceiptText className="size-4" />;
              },
              onClick: onInvoices,
              hidden: (row: Expense) => (row.invoices_count ?? invoiceCountsByExpenseId?.get(row.id) ?? 0) === 0,
            }]
            : []),
          ...(onAddInvoice
            ? [{
              label: 'إضافة فاتورة',
              icon: <FilePlus2 className="size-4" />,
              onClick: onAddInvoice,
            }]
            : []),
        ].length > 0 ? [
          ...(onView
            ? [
              {
                label: 'تفاصيل المصروف',
                icon: <Eye className="size-4" />,
                onClick: onView,
              },
            ]
            : []),
          ...(onPayments
            ? [
              {
                label: 'الدفعات',
                icon: <CreditCard className="size-4" />,
                onClick: onPayments,
              },
            ]
            : []),
          ...(onSettlePayment
            ? [
              {
                label: 'تسديد الدفعة',
                icon: <HandCoins className="size-4" />,
                onClick: onSettlePayment,
              },
            ]
            : []),
          ...(onInvoices
            && !invoicesLoading
            && !invoicesError
            && data.some((row) => (row.invoices_count ?? invoiceCountsByExpenseId?.get(row.id) ?? 0) > 0)
            ? [{
              label: (row: Expense) => {
                const count = row.invoices_count ?? invoiceCountsByExpenseId?.get(row.id) ?? 0;
                return count > 0 ? `عرض الفواتير (${count})` : 'عرض الفواتير';
              },
              icon: (row: Expense) => {
                return (row.invoices_count ?? invoiceCountsByExpenseId?.get(row.id) ?? 0) > 0
                  ? <ReceiptText className="size-4" />
                  : <ReceiptText className="size-4 opacity-50" />;
              },
              onClick: onInvoices,
              hidden: (row: Expense) => (row.invoices_count ?? invoiceCountsByExpenseId?.get(row.id) ?? 0) === 0,
            }]
            : []),
          ...(onAddInvoice
            ? [{
              label: 'إضافة فاتورة',
              icon: <FilePlus2 className="size-4" />,
              onClick: onAddInvoice,
            }]
            : []),
        ] : undefined,
      }}
    />
  );
}
