import { useQuery } from '@tanstack/react-query';
import { DateTimeRangePicker, type DateTimeRangeValue } from '@/shared/components/ui/date-time-range-picker';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { usersApi } from '@/features/users/api/users.api';
import type { UserRole } from '@/features/users/types';

const userRoles: UserRole[] = [
  'admin',
  'client',
  'investor',
  'craftsman',
  'employee',
  'engineer',
  'supplier',
  'trustee',
];

const roleLabels: Record<UserRole, string> = {
  admin: 'المدير',
  client: 'العميل',
  investor: 'المستثمر',
  craftsman: 'الحرفي',
  employee: 'الموظف',
  engineer: 'المهندس',
  supplier: 'المورد',
  trustee: 'الأمين',
};

export type ExpensesFilterFormProps = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isPosted: string;
  setIsPosted: (val: string) => void;
  userRole: UserRole | '';
  setUserRole: (val: UserRole | '') => void;
  userId: number | '';
  setUserId: (val: number | '') => void;
  creatorRole: UserRole | '';
  setCreatorRole: (val: UserRole | '') => void;
  creatorId: number | '';
  setCreatorId: (val: number | '') => void;
  rangeValue: DateTimeRangeValue | undefined;
  handleRangeChange: (value: DateTimeRangeValue | undefined) => void;
};

export function ExpensesFilterForm({
  searchQuery,
  setSearchQuery,
  isPosted,
  setIsPosted,
  userRole,
  setUserRole,
  userId,
  setUserId,
  creatorRole,
  setCreatorRole,
  creatorId,
  setCreatorId,
  rangeValue,
  handleRangeChange,
}: ExpensesFilterFormProps) {
  const roleUsersQuery = useQuery({
    queryKey: ['expenses-filter-users', userRole] as const,
    queryFn: () => usersApi.getUsersByRole(userRole as UserRole, 1, 1000),
    enabled: Boolean(userRole),
  });
  const roleUsers = roleUsersQuery.data?.data ?? [];

  const creatorUsersQuery = useQuery({
    queryKey: ['expenses-filter-creators', creatorRole] as const,
    queryFn: () => usersApi.getUsersByRole(creatorRole as UserRole, 1, 1000),
    enabled: Boolean(creatorRole),
  });
  const creatorUsers = creatorUsersQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="filter-search">البحث</Label>
        <Input
          id="filter-search"
          type="text"
          placeholder="البحث بالبيان..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-is-posted">حالة الترحيل</Label>
        <Select
          value={isPosted}
          onValueChange={(val) => setIsPosted(val ?? '')}
        >
          <SelectTrigger id="filter-is-posted">
            {isPosted === 'true' ? 'مرحل' : isPosted === 'false' ? 'غير مرحل' : 'الكل'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">الكل</SelectItem>
            <SelectItem value="true">مرحل</SelectItem>
            <SelectItem value="false">غير مرحل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-xs font-semibold text-foreground">فلترة بالمستلم </p>
        <div className="space-y-1.5">
          <Label>نوع المستلم </Label>
          <Select
            value={userRole}
            onValueChange={(val) => {
              setUserRole(val as UserRole);
              setUserId('');
            }}
          >
            <SelectTrigger>
              {userRole ? roleLabels[userRole] : 'اختر نوع المستخدم'}
            </SelectTrigger>
            <SelectContent>
              {userRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {roleLabels[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>المستلم</Label>
          {roleUsersQuery.isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <SearchableSelect
              value={userId || null}
              onValueChange={(val) => setUserId(val ? Number(val) : '')}
              disabled={!userRole}
              placeholder="اختر المستخدم"
              searchPlaceholder="البحث عن مستخدم..."
              emptyMessage="لا يوجد مستخدمون."
              options={roleUsers.map((item: any) => ({
                value: item.user.id,
                label: item.user.name,
              }))}
            />
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-xs font-semibold text-foreground">فلترة بـ أنشئ بواسطة</p>
        <div className="space-y-1.5">
          <Label>نوع المستخدم</Label>
          <Select
            value={creatorRole}
            onValueChange={(val) => {
              setCreatorRole(val as UserRole);
              setCreatorId('');
            }}
          >
            <SelectTrigger>
              {creatorRole ? roleLabels[creatorRole] : 'اختر نوع المستخدم'}
            </SelectTrigger>
            <SelectContent>
              {userRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {roleLabels[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>أنشئ بواسطة</Label>
          {creatorUsersQuery.isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <SearchableSelect
              value={creatorId || null}
              onValueChange={(val) => setCreatorId(val ? Number(val) : '')}
              disabled={!creatorRole}
              placeholder="اختر المستخدم"
              searchPlaceholder="البحث عن مستخدم..."
              emptyMessage="لا يوجد مستخدمون."
              options={creatorUsers.map((item: any) => ({
                value: item.user.id,
                label: item.user.name,
              }))}
            />
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>مجال التاريخ والوقت</Label>
        <DateTimeRangePicker
          value={rangeValue}
          onChange={handleRangeChange}
          popoverSide="top"
          popoverAlign="end"
        />
      </div>
    </div>
  );
}
