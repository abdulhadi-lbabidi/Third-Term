import { useState } from 'react';
import { PageHeader } from '@/features/components/page-header';
import { AuditLogsTable } from './components/audit-logs.table';
import { useAuditLogs } from './audit-logs.hooks';
import { History, RotateCcw } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/features/users/api/users.api';
import type { UserRole } from '@/features/users/types';
import { Button } from '@/shared/components/ui/button';

const rolesList = [
  { value: 'admin', label: 'مدير' },
  { value: 'client', label: 'عميل' },
  { value: 'investor', label: 'مستثمر' },
  { value: 'craftsman', label: 'حرفي' },
  { value: 'employee', label: 'موظف' },
  { value: 'engineer', label: 'مهندس' },
  { value: 'supplier', label: 'مورد' },
  { value: 'trustee', label: 'أمين' },
] as const;

const affectedTablesList = [
  { value: 'company_funds', label: 'صناديق الشركة' },
  { value: 'currencies', label: 'العملات' },
  { value: 'departments', label: 'الأقسام' },
  { value: 'directories', label: 'المجلدات' },
  { value: 'employee_payments', label: 'رواتب الموظفين' },
  { value: 'expenses', label: 'المصاريف' },
  { value: 'fund_currencies', label: 'عملات الصناديق' },
  { value: 'invoice_items', label: 'عناصر الفواتير' },
  { value: 'invoices', label: 'الفواتير' },
  { value: 'items', label: 'البنود' },
  { value: 'materials', label: 'المواد' },
  { value: 'project_fund_currencies', label: 'عملات صناديق المشاريع' },
  { value: 'projects', label: 'المشاريع' },
  { value: 'project_stages', label: 'مراحل المشاريع' },
  { value: 'project_teams', label: 'فرق عمل المشاريع' },
  { value: 're_invoice_items', label: 'عناصر فواتير الإيرادات' },
  { value: 're_invoices', label: 'فواتير الإيرادات' },
  { value: 'revenues', label: 'الإيرادات' },
  { value: 'stage_timelines', label: 'التواريخ الزمنية للمراحل' },
  { value: 'transactions', label: 'الحركات المالية' },
] as const;

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [actionType, setActionType] = useState<string>('all');
  const [userRole, setUserRole] = useState<UserRole | 'all'>('all');
  const [userId, setUserId] = useState<string>('all');
  const [affectedTable, setAffectedTable] = useState<string>('all');

  const selectedRole = userRole === 'all' ? undefined : userRole;
  const usersQuery = useQuery({
    queryKey: ['audit-logs-users', selectedRole] as const,
    queryFn: () => selectedRole ? usersApi.getUsersByRole(selectedRole).then(res => res.data) : Promise.resolve([]),
    enabled: userRole !== 'all',
  });
  const users = usersQuery.data ?? [];

  const filters: Record<string, any> = {};
  if (actionType !== 'all') {
    filters['filter[action_type]'] = actionType;
  }
  if (userId !== 'all') {
    filters['filter[user_id]'] = userId;
  }
  if (affectedTable !== 'all') {
    filters['filter[affected_table]'] = affectedTable;
  }

  const { data: response, isLoading } = useAuditLogs(page, perPage, filters);

  const auditLogs = response?.data ?? [];
  const meta = response?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  const handleRoleChange = (role: UserRole | 'all') => {
    setUserRole(role);
    setUserId('all');
    setPage(1);
  };

  const handleActionTypeChange = (value: string) => {
    setActionType(value);
    setPage(1);
  };

  const handleUserChange = (value: string) => {
    setUserId(value || 'all');
    setPage(1);
  };

  const handleAffectedTableChange = (value: string) => {
    setAffectedTable(value);
    setPage(1);
  };

  const handleReset = () => {
    setActionType('all');
    setUserRole('all');
    setUserId('all');
    setAffectedTable('all');
    setPage(1);
  };

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="سجل النظام"
        title="سجل العمليات"
        icon={History}
      />

      <div className="flex flex-wrap items-start gap-4 bg-card border border-slate-200/80 rounded-lg p-4">
        <Tabs value={actionType} onValueChange={handleActionTypeChange} className="w-fit">
          <TabsList>
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="إضافة">إضافة</TabsTrigger>
            <TabsTrigger value="تعديل">تعديل</TabsTrigger>
            <TabsTrigger value="حذف">حذف</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-48">
          <Select
            value={affectedTable}
            onValueChange={handleAffectedTableChange}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="الجدول المتأثر">
                {affectedTable === 'all' ? 'كل الجداول' : (affectedTablesList.find(t => t.value === affectedTable)?.label)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الجداول</SelectItem>
              {affectedTablesList.map((table) => (
                <SelectItem key={table.value} value={table.value}>
                  {table.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Select
            value={userRole}
            onValueChange={(val) => handleRoleChange(val as UserRole | 'all')}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="نوع المستخدم">
                {userRole === 'all' ? 'كل أنواع المستخدمين' : (rolesList.find(r => r.value === userRole)?.label)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل أنواع المستخدمين</SelectItem>
              {rolesList.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-64">
          <SearchableSelect
            value={userId === 'all' ? '' : userId}
            onValueChange={handleUserChange}
            options={users.map((u: any) => ({
              value: String(u.user?.id ?? u.id),
              label: u.user?.name ?? u.name ?? '',
            }))}
            placeholder={userRole === 'all' ? 'اختر نوع المستخدم أولاً' : 'اختر المستخدم'}
            searchPlaceholder="ابحث عن مستخدم..."
            loading={usersQuery.isLoading}
            disabled={userRole === 'all'}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="!p-2 !py-1 !h-8"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <AuditLogsTable data={auditLogs} loading={isLoading} />

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        meta={meta}
      />
    </div>
  );
}
