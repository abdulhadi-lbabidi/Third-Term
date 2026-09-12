import { DataTable, type DataTableColumn } from '@/features/components/data-table';
import type { AuditLog } from '../types';

type AuditLogsTableProps = {
  data: AuditLog[];
  loading?: boolean;
};

const getActionBadgeClass = (action?: string) => {
  if (!action) return 'inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700';
  const lower = action.toLowerCase();
  if (lower === 'إضافة' || lower === 'create' || lower === 'created') {
    return 'inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700';
  }
  if (lower === 'تعديل' || lower === 'update' || lower === 'updated') {
    return 'inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700';
  }
  if (lower === 'حذف' || lower === 'delete' || lower === 'deleted') {
    return 'inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700';
  }
  return 'inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700';
};

const getEventLabel = (action?: string) => {
  if (!action) return '-';
  const lower = action.toLowerCase();
  if (lower === 'created' || lower === 'create') return 'إضافة';
  if (lower === 'updated' || lower === 'update') return 'تعديل';
  if (lower === 'deleted' || lower === 'delete') return 'حذف';
  return action;
};

const propertyTranslations: Record<string, string> = {
  is_favorite: 'مميز',
  name: 'الاسم',
  main_manager: 'المدير الرئيسي',
};

const formatPropertyValue = (key: string, val: any): string => {
  if (key === 'is_favorite') {
    if (val === 1 || val === '1' || val === true || val === 'true') return 'نعم';
    if (val === 0 || val === '0' || val === false || val === 'false') return 'لا';
  }
  if (typeof val === 'boolean') {
    return val ? 'نعم' : 'لا';
  }
  if (typeof val === 'object' && val !== null) {
    return JSON.stringify(val);
  }
  return String(val ?? '-');
};

const isHiddenPropertyKey = (key: string) => {
  if (key === 'updated_at' || key === 'created_at') return true;
  const lower = key.toLowerCase();
  return lower === 'id' || lower.endsWith('_id');
};

const renderObjectProperties = (obj?: Record<string, any> | null) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }
  const entries = Object.entries(obj).filter(([key]) => !isHiddenPropertyKey(key));
  if (entries.length === 0) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }
  return (
    <div className="flex flex-col gap-1 max-w-xs text-xs">
      {entries.map(([key, val]) => {
        const displayKey = propertyTranslations[key] || key;
        const displayVal = formatPropertyValue(key, val);
        return (
          <div key={key} className="flex flex-wrap items-baseline gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded px-1.5 py-0.5">
            <span className="font-semibold text-slate-600 dark:text-slate-400 font-mono text-[11px]">{displayKey}:</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium break-all">{displayVal}</span>
          </div>
        );
      })}
    </div>
  );
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
  funds: 'صندوق مستخدم',
  project_funds: 'صندوق مشروع',
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
      cell: (row) => {
        const action = row.event || row.action_type;
        return <span className={getActionBadgeClass(action)}>{getEventLabel(action)}</span>;
      },
    },
    {
      header: 'السجل / الجدول',
      cell: (row) => {
        const name = row.log_name || row.affected_table || '-';
        return <span className="text-xs font-medium text-slate-700">{tableTranslations[name] || name}</span>;
      },
    },
    {
      header: 'البيان',
      cell: (row) => <span className="text-sm font-medium">{row.description}</span>,
    },
    {
      header: 'البيانات الحالية (Attributes)',
      cell: (row) => renderObjectProperties(row.properties?.attributes),
    },
    {
      header: 'البيانات السابقة (Old)',
      cell: (row) => renderObjectProperties(row.properties?.old),
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
