import { Banknote } from 'lucide-react';
import dayjs from 'dayjs';
import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { EmployeePayment } from '../types';

type EmployeePaymentsTableProps = {
  data: EmployeePayment[];
  loading?: boolean;
  onEdit?: (payment: EmployeePayment) => void;
  onDelete?: (payment: EmployeePayment) => void;
};

export function EmployeePaymentsTable({ data, loading, onEdit, onDelete }: EmployeePaymentsTableProps) {
  const columns: DataTableColumn<EmployeePayment>[] = [
    { header: 'الموظف', cell: (payment) => payment.employee?.user?.name ?? '-' },
    { header: 'المسمى الوظيفي', cell: (payment) => payment.employee?.job_title ?? '-' },
    { header: 'الزيادات', cell: (payment) => String(payment.bonuses) },
    { header: 'الاستقطاعات', cell: (payment) => String(payment.deductions) },
    { header: 'تاريخ الدفع', cell: (payment) => payment.payment_date ? dayjs(payment.payment_date).format('YYYY-MM-DD') : '-' },
    { header: 'المبلغ', cell: (payment) => String(payment.amount) },
    { header: 'تاريخ الإنشاء', cell: (payment) => payment.created_at ?? '-' },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
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
