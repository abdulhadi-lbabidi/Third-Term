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

export type RevenuesFilterFormProps = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
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

export function RevenuesFilterForm({
  searchQuery,
  setSearchQuery,
  userRole: _userRole,
  setUserRole: _setUserRole,
  userId: _userId,
  setUserId: _setUserId,
  creatorRole,
  setCreatorRole,
  creatorId,
  setCreatorId,
  rangeValue,
  handleRangeChange,
}: RevenuesFilterFormProps) {


  const creatorUsersQuery = useQuery({
    queryKey: ['revenues-filter-creators', creatorRole] as const,
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
          placeholder="البحث بالبيان أو المستلم بيد..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>





      <div className="space-y-1.5">
        <Label>نوع المستلم</Label>
        <Select
          value={creatorRole}
          onValueChange={(val) => {
            setCreatorRole(val as UserRole);
            setCreatorId('');
          }}
        >
          <SelectTrigger>
            {creatorRole ? roleLabels[creatorRole] : 'اختر نوع المستلم'}
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
        <Label>مستلم بواسطة</Label>
        {creatorUsersQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <SearchableSelect
            value={creatorId || null}
            onValueChange={(val) => setCreatorId(val ? Number(val) : '')}
            disabled={!creatorRole}
            placeholder="اختر المستلم"
            searchPlaceholder="البحث عن مستلم..."
            emptyMessage="لا يوجد مستلمون."
            options={creatorUsers.map((item: any) => ({
              value: item.user.id,
              label: item.user.name,
            }))}
          />
        )}
      </div>

      <div className="hidden sm:block space-y-1.5">
        <Label>مجال التاريخ والوقت</Label>
        <DateTimeRangePicker
          value={rangeValue}
          onChange={handleRangeChange}
          contentClassName="revenues-date-picker"
        />
      </div>
    </div>
  );
}
