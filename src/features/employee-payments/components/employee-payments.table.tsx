// removed unused import
import dayjs from 'dayjs';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { EmployeePayment } from '../types';

type EmployeePaymentsTableProps = {
  data: EmployeePayment[];
  loading?: boolean;
  onEdit?: (payment: EmployeePayment) => void;
  onDelete?: (payment: EmployeePayment) => void;
  sort?: string;
  onSortChange?: (sort: string | undefined) => void;
};

export function EmployeePaymentsTable({ data, loading, onEdit, onDelete, sort, onSortChange }: EmployeePaymentsTableProps) {
  const columns: DataTableColumn<EmployeePayment>[] = [
    { header: 'الموظف', cell: (payment) => payment.employee?.user?.name ?? '-', sortable: true, sortKey: 'employee_name' },
    { header: 'المسمى الوظيفي', cell: (payment) => payment.employee?.job_title ?? '-' },
    { header: 'صندوق الشركة', cell: (payment) => payment.company_fund_currency?.company_fund?.name ?? '-' },
    { header: 'العملة', cell: (payment) => payment.company_fund_currency?.currency?.currency ?? '-' },
    { header: 'الزيادات', cell: (payment) => String(payment.bonuses), sortable: true, sortKey: 'bonuses' },
    { header: 'الاستقطاعات', cell: (payment) => String(payment.deductions), sortable: true, sortKey: 'deductions' },
    { header: 'تاريخ الدفع', cell: (payment) => payment.payment_date ? dayjs(payment.payment_date).format('YYYY-MM-DD') : '-', sortable: true, sortKey: 'payment_date' },
    { header: 'المبلغ', cell: (payment) => String(payment.amount), sortable: true, sortKey: 'amount' },
    { header: 'تاريخ الإنشاء', cell: (payment) => payment.created_at ?? '-' },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      sort={sort}
      onSortChange={onSortChange}
      emptyLabel="لا توجد رواتب موظفين"
      loadingLabel="جاري التحميل..."
      confirmTitle="تأكيد الحذف"
      confirmDescription="هل أنت متأكد من حذف هذا الراتب؟ لا يمكن التراجع عن هذا الإجراء."
      cancelLabel="إلغاء"
      deleteLabel="حذف"
      actions={{
        onEdit,
        onDelete,
      }}
    />
  );
}
