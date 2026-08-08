import { useQuery } from '@tanstack/react-query';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { usersApi } from '@/features/users/api/users.api';
import type { UserRole } from '@/features/users/types';

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

export type AuditLogsFilterFormProps = {
  actionType: string;
  setActionType: (val: string) => void;
  affectedTable: string;
  setAffectedTable: (val: string) => void;
  userRole: UserRole | 'all';
  setUserRole: (val: UserRole | 'all') => void;
  userId: string;
  setUserId: (val: string) => void;
};

export function AuditLogsFilterForm({
  actionType,
  setActionType,
  affectedTable,
  setAffectedTable,
  userRole,
  setUserRole,
  userId,
  setUserId,
}: AuditLogsFilterFormProps) {
  const selectedRole = userRole === 'all' ? undefined : userRole;
  const usersQuery = useQuery({
    queryKey: ['audit-logs-users', selectedRole] as const,
    queryFn: () => selectedRole ? usersApi.getUsersByRole(selectedRole).then(res => res.data) : Promise.resolve([]),
    enabled: userRole !== 'all',
  });
  const users = usersQuery.data ?? [];

  const handleRoleChange = (role: UserRole | 'all') => {
    setUserRole(role);
    setUserId('all');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>نوع العملية</Label>
        <Select value={actionType} onValueChange={setActionType}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="اختر نوع العملية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="إضافة">إضافة</SelectItem>
            <SelectItem value="تعديل">تعديل</SelectItem>
            <SelectItem value="حذف">حذف</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>الجدول المتأثر</Label>
        <Select value={affectedTable} onValueChange={setAffectedTable}>
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

      <div className="space-y-1.5">
        <Label>نوع المستخدم</Label>
        <Select value={userRole} onValueChange={(val) => handleRoleChange(val as UserRole | 'all')}>
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

      <div className="space-y-1.5">
        <Label>المستخدم</Label>
        <SearchableSelect
          value={userId === 'all' ? '' : userId}
          onValueChange={(val) => setUserId(val || 'all')}
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
    </div>
  );
}
