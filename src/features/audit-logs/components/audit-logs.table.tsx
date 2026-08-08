import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { AuditLog } from '../types';

type AuditLogsTableProps = {
  data: AuditLog[];
  loading?: boolean;
};

const getActionBadgeClass = (action: string) => {
  if (action === 'إضافة' || action === 'create') {
    return 'inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700';
  }
  if (action === 'تعديل' || action === 'update') {
    return 'inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700';
  }
  if (action === 'حذف' || action === 'delete') {
    return 'inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700';
  }
  return 'inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700';
};

const tableTranslations: Record<string, string> = {
  company_funds: 'صناديق الشركة',
  currencies: 'العملات',
  departments: 'الأقسام',
  directories: 'المجلدات',
  employee_payments: 'رواتب الموظفين',
  expenses: 'المصاريف',
  fund_currencies: 'عملات الصناديق',
  invoice_items: 'عناصر الفواتير',
  invoices: 'الفواتير',
  items: 'البنود',
  materials: 'المواد',
  project_fund_currencies: 'عملات صناديق المشاريع',
  funds:"صندوق مستخدم",
  project_funds:"صندوق مشروع",
  projects: 'المشاريع',
  project_stages: 'مراحل المشاريع',
  project_teams: 'فرق عمل المشاريع',
  re_invoice_items: 'عناصر فواتير الإيرادات',
  re_invoices: 'فواتير الإيرادات',
  revenues: 'الإيرادات',
  stage_timelines: 'التواريخ الزمنية للمراحل',
  transactions: 'الحركات المالية',
};

export function AuditLogsTable({ data, loading }: AuditLogsTableProps) {
  const columns: DataTableColumn<AuditLog>[] = [
    {
      header: '#',
      cell: (row) => <span className="font-mono text-xs font-medium text-muted-foreground">{row.id}</span>,
    },
    {
      header: 'نوع العملية',
      cell: (row) => <span className={getActionBadgeClass(row.action_type)}>{row.action_type}</span>,
    },
    {
      header: 'الجدول المتأثر',
      cell: (row) => <span className="text-xs font-medium text-slate-700">{tableTranslations[row.affected_table] || row.affected_table}</span>,
    },
    {
      header: 'البيان',
      cell: (row) => <span className="text-sm font-medium">{row.description}</span>,
    },
    {
      header: 'المستخدم',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.user?.name ?? '-'}</span>
          {row.user?.email && <span className="text-xs text-muted-foreground">{row.user.email}</span>}
        </div>
      ),
    },
    {
      header: 'تاريخ العملية',
      cell: (row) => <span className="text-xs text-muted-foreground">{row.created_at ?? '-'}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyLabel="لا يوجد سجلات حتى الآن"
      loadingLabel="جاري تحميل سجل العمليات..."
      confirmTitle=""
      confirmDescription=""
      cancelLabel=""
      deleteLabel=""
    />
  );
}
