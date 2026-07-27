import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { UserTabs } from './components/user-tabs';
import { UsersTable } from './components/users.table';
import { usersApi } from './api/users.api';
import type {
  AdminRecord,
  ClientRecord,
  CraftsmanRecord,
  EmployeeRecord,
  EngineerRecord,
  InvestorRecord,
  SupplierRecord,
  TrusteeRecord,
  UserRole,
} from './types';
import { PageHeader } from '../components/page-header';

const userRoles: UserRole[] = ['admin', 'client', 'investor', 'craftsman', 'employee', 'engineer', 'supplier', 'trustee'];

type UsersTabRecord =
  | AdminRecord
  | ClientRecord
  | InvestorRecord
  | CraftsmanRecord
  | EmployeeRecord
  | EngineerRecord
  | SupplierRecord
  | TrusteeRecord;

const usersQueryKeys = {
  all: ['users'] as const,
  byRole: (role: UserRole) => ['users', role] as const,
};

function UsersTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-6 gap-3 rounded-lg border border-slate-100 p-3">
              <div className="h-4 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('tab');
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    return userRoles.includes(initialRole as UserRole) ? (initialRole as UserRole) : 'admin';
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && userRoles.includes(tab as UserRole) && tab !== activeRole) {
      setActiveRole(tab as UserRole);
    }
  }, [activeRole, searchParams]);

  const usersQuery = useQuery<UsersTabRecord[]>({
    queryKey: usersQueryKeys.byRole(activeRole),
    queryFn: () => usersApi.getUsersByRole(activeRole) as Promise<UsersTabRecord[]>,
  });

  const deleteMutation = useMutation({
    mutationFn: (row: UsersTabRecord) => usersApi.deleteUserByRole(activeRole, row.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });

  const handleDelete = async (row: UsersTabRecord) => {
    await deleteMutation.mutateAsync(row);
  };

  function handleEdit(row: UsersTabRecord) {
    navigate(`/users/edit/${activeRole}/${row.id}?tab=${activeRole}`);
  }

  function handleFunds(row: UsersTabRecord) {
    navigate(`/users/${row.id}/${encodeURIComponent(row.user.name)}/funds?tab=${activeRole}`);
  }

  function handleEmployeePayments(row: UsersTabRecord) {
    if (activeRole !== 'employee') return;
    navigate(`/employees/${row.id}/${encodeURIComponent(row.user.name)}/payments`);
  }

  const columns = useMemo(
    () => [
      { header: 'الاسم', cell: (row: UsersTabRecord) => row.user.name },
      { header: 'البريد الإلكتروني', cell: (row: UsersTabRecord) => row.user.email },
      { header: 'الهاتف', cell: (row: UsersTabRecord) => row.user.phone_number },
      { header: 'العنوان', cell: (row: UsersTabRecord) => row.user.address },
      activeRole === 'investor'
        ? { header: 'نسبة الاستثمار', cell: (row: UsersTabRecord) => String((row as InvestorRecord).investment_ratio ?? '-') }
        : null,
      activeRole === 'employee'
        ? { header: 'المسمى الوظيفي', cell: (row: UsersTabRecord) => String((row as EmployeeRecord).job_title ?? '-') }
        : null,
      activeRole === 'engineer'
        ? { header: 'المسمى الوظيفي', cell: (row: UsersTabRecord) => String((row as EngineerRecord).job_title ?? '-') }
        : null,
      activeRole === 'engineer'
        ? { header: 'الراتب الأساسي', cell: (row: UsersTabRecord) => String((row as EngineerRecord).base_salary ?? '-') }
        : null,
      activeRole === 'trustee'
        ? { header: 'صلة القرابة', cell: (row: UsersTabRecord) => String((row as TrusteeRecord).kinship_relation ?? '-') }
        : null,
      { header: 'تاريخ الإنشاء', cell: (row: UsersTabRecord) => dayjs(row.created_at).format('YYYY-MM-DD') },
    ],
    [activeRole]
  );

  const showSkeleton = usersQuery.isFetching && !usersQuery.data;

  return (
    <div className="space-y-3">
      <PageHeader
        badge="المستخدمون"
        title="المستخدمون"
        action={
          <Button className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800">
            <Link to={`/users/new${activeRole ? `?tab=${activeRole}` : ''}`}>إضافة مستخدم</Link>
          </Button>
        }
      />

      <UserTabs
        roles={userRoles}
        activeRole={activeRole}
        onChange={(role) => {
          setActiveRole(role);
          setSearchParams({ tab: role });
        }}
      />

      {showSkeleton ? (
        <UsersTableSkeleton />
      ) : (
        <UsersTable
          columns={columns.filter(Boolean) as NonNullable<typeof columns[number]>[]}
          data={usersQuery.data ?? []}
          loading={usersQuery.isFetching}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onFunds={handleFunds}
          onEmployeePayments={activeRole === 'employee' ? handleEmployeePayments : undefined}
        />
      )}
    </div>
  );
}

