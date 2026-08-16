import { useQuery } from '@tanstack/react-query';
import { DateTimeRangePicker, type DateTimeRangeValue } from '@/shared/components/ui/date-time-range-picker';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { usersApi } from '@/features/users/api/users.api';
import { currenciesApi } from '@/features/currencies/currencies.api';
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

export type MoneyExchangesFilterFormProps = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  operation: string;
  setOperation: (val: string) => void;
  fromCurrency: string;
  setFromCurrency: (val: string) => void;
  toCurrency: string;
  setToCurrency: (val: string) => void;
  creatorRole: UserRole | '';
  setCreatorRole: (val: UserRole | '') => void;
  creatorId: number | '';
  setCreatorId: (val: number | '') => void;
  userRole: UserRole | '';
  setUserRole: (val: UserRole | '') => void;
  userId: number | '';
  setUserId: (val: number | '') => void;
  rangeValue: DateTimeRangeValue | undefined;
  handleRangeChange: (value: DateTimeRangeValue | undefined) => void;
};

export function MoneyExchangesFilterForm({
  searchQuery,
  setSearchQuery,
  operation,
  setOperation,
  fromCurrency,
  setFromCurrency,
  toCurrency,
  setToCurrency,
  creatorRole,
  setCreatorRole,
  creatorId,
  setCreatorId,
  userRole,
  setUserRole,
  userId,
  setUserId,
  rangeValue,
  handleRangeChange,
}: MoneyExchangesFilterFormProps) {
  const currenciesQuery = useQuery({
    queryKey: ['currencies-filter'] as const,
    queryFn: () => currenciesApi.getAll(1, 1000),
  });
  const currencies = currenciesQuery.data?.data ?? [];

  const creatorUsersQuery = useQuery({
    queryKey: ['money-exchanges-filter-creators', creatorRole] as const,
    queryFn: () => usersApi.getUsersByRole(creatorRole as UserRole, 1, 1000),
    enabled: Boolean(creatorRole),
  });
  const creatorUsers = creatorUsersQuery.data?.data ?? [];

  const targetUsersQuery = useQuery({
    queryKey: ['money-exchanges-filter-targets', userRole] as const,
    queryFn: () => usersApi.getUsersByRole(userRole as UserRole, 1, 1000),
    enabled: Boolean(userRole),
  });
  const targetUsers = targetUsersQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="filter-search">البحث</Label>
        <Input
          id="filter-search"
          type="text"
          placeholder="البحث بالمبلغ أو سعر التصريف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-operation">العملية</Label>
        <Select value={operation} onValueChange={(value) => setOperation(value ?? '')}>
          <SelectTrigger id="filter-operation">
            {operation === 'multiply' ? 'ضرب (*)' : operation === 'divide' ? 'قسمة (/)' : 'الكل'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">الكل</SelectItem>
            <SelectItem value="multiply">ضرب (*)</SelectItem>
            <SelectItem value="divide">قسمة (/)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-from-currency">من العملة</Label>
        {currenciesQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select value={fromCurrency} onValueChange={(value) => setFromCurrency(value ?? '')}>
            <SelectTrigger id="filter-from-currency">
              <SelectValue placeholder="الكل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">الكل</SelectItem>
              {currencies.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.currency} ({c.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-to-currency">إلى العملة</Label>
        {currenciesQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select value={toCurrency} onValueChange={(value) => setToCurrency(value ?? '')}>
            <SelectTrigger id="filter-to-currency">
              <SelectValue placeholder="الكل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">الكل</SelectItem>
              {currencies.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.currency} ({c.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>نوع المستخدم المنشئ</Label>
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

      <div className="space-y-1.5">
        <Label>نوع المستخدم المستهدف</Label>
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
        <Label>المستخدم المستهدف</Label>
        {targetUsersQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <SearchableSelect
            value={userId || null}
            onValueChange={(val) => setUserId(val ? Number(val) : '')}
            disabled={!userRole}
            placeholder="اختر المستخدم"
            searchPlaceholder="البحث عن مستخدم..."
            emptyMessage="لا يوجد مستخدمون."
            options={targetUsers.map((item: any) => ({
              value: item.user.id,
              label: item.user.name,
            }))}
          />
        )}
      </div>

      <div className="hidden sm:block space-y-1.5">
        <Label>مجال التاريخ والوقت</Label>
        <DateTimeRangePicker value={rangeValue} onChange={handleRangeChange} />
      </div>
    </div>
  );
}
