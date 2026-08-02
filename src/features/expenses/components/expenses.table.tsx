import { Eye, Receipt } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import { 
  getBooleanLabel, 
  getTextLabel, 
  getCurrencyStringFromInfo, 
  UserLink, 
  FundLink,
  type TableUser
} from '@/features/components/table-helpers';
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
};

export function ExpensesTable({ data, loading, onView, onEdit, onDelete, onInvoices }: ExpensesTableProps) {
  const columns: DataTableColumn<Expense>[] = [
    { header: 'الوصف', cell: (row) => row.description },
    {
      header: 'المبلغ',
      cell: (row) => {
        const amount = Number(row.amount || 0).toLocaleString();
        const currency = getCurrencyStringFromInfo(row.expenseable_info);
        return (
          <div className="flex items-center gap-1">
            <span className="finance-num font-medium">{amount}</span>
            {currency ? <span className="text-xs text-muted-foreground">{currency}</span> : null}
          </div>
        );
      }
    },
    { header: 'المستخدم', cell: (row) => <UserLink user={(row as ExpenseRow).user} /> },
    { header: 'نوع الصرف', cell: (row) => <FundLink type={row.expenseable_type} info={row.expenseable_info} /> },
    {
      header: 'تم الترحيل',
      cell: (row) => (
        <span className={row.is_posted ? 'status-badge-success' : 'status-badge-danger'}>
          {getBooleanLabel(row.is_posted)}
        </span>
      ),
    },
    { header: 'أنشئ بواسطة', cell: (row) => <UserLink user={(row as ExpenseRow).created_by} /> },
    { header: 'المعرف', cell: (row) => String(row.expenseable_id ?? '-') },
    { header: 'تاريخ الإنشاء', cell: (row) => row.created_at ?? '-' },
  ];

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
      actions={{
        onEdit,
        onDelete,
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
          ...(onInvoices
            ? [
                {
                  label: 'فواتير المصروف',
                  icon: <Receipt className="size-4" />,
                  onClick: onInvoices,
                },
              ]
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
          ...(onInvoices
            ? [
                {
                  label: 'فواتير المصروف',
                  icon: <Receipt className="size-4" />,
                  onClick: onInvoices,
                },
              ]
            : []),
        ] : undefined,
      }}
    />
  );
}
