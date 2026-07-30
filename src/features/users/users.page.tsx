import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { UsersTable } from './components/users.table';
import { usersApi, type UsersRoleResponse } from './api/users.api';
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
import { Shield, User, TrendingUp, Hammer, BadgeCheck, HardHat, Truck, Lock, Users } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';

const userRoles: UserRole[] = ['admin', 'client', 'investor', 'craftsman', 'employee', 'engineer', 'supplier', 'trustee'];

const USER_TABS = [
  { value: 'admin', label: 'المدراء', icon: <Shield className="h-4 w-4" /> },
  { value: 'client', label: 'العملاء', icon: <User className="h-4 w-4" /> },
  { value: 'investor', label: 'المستثمرون', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'craftsman', label: 'الحرفيون', icon: <Hammer className="h-4 w-4" /> },
  { value: 'employee', label: 'الموظفون', icon: <BadgeCheck className="h-4 w-4" /> },
  { value: 'engineer', label: 'المهندسون', icon: <HardHat className="h-4 w-4" /> },
  { value: 'supplier', label: 'الموردون', icon: <Truck className="h-4 w-4" /> },
  { value: 'trustee', label: 'الأوصياء', icon: <Lock className="h-4 w-4" /> },
];

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
  byRole: (role: UserRole, page: number, perPage: number) => ['users', role, page, perPage] as const,
};

function UsersTableSkeleton() {
  return (
    <div className="surface-panel">
      <div className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-6 gap-3 rounded-md border border-border p-3">
              <div className="h-4 animate-pulse rounded bg-muted" />
              <div className="h-4 animate-pulse rounded bg-muted" />
              <div className="h-4 animate-pulse rounded bg-muted" />
              <div className="h-4 animate-pulse rounded bg-muted" />
              <div className="h-4 animate-pulse rounded bg-muted" />
              <div className="h-4 animate-pulse rounded bg-muted" />
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
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('tab');
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    return userRoles.includes(initialRole as UserRole) ? (initialRole as UserRole) : 'admin';
  });

  const [page, setPage] = useState(1);
  const perPage = 50;

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && userRoles.includes(tab as UserRole) && tab !== activeRole) {
      setActiveRole(tab as UserRole);
      setPage(1);
    }
  }, [activeRole, searchParams]);

  const usersQuery = useQuery<UsersRoleResponse<UsersTabRecord>>({
    queryKey: usersQueryKeys.byRole(activeRole, page, perPage),
    queryFn: () => usersApi.getUsersByRole(activeRole, page, perPage),
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
  const users = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  return (
    <div className="flex flex-col flex-1 space-y-4">
      <PageHeader
        badge="المستخدمون"
        title="المستخدمون"
        icon={Users}
        tabs={USER_TABS}
        defaultTab={activeRole}
        action={
          <Button>
            <Link to={`/users/new${activeRole ? `?tab=${activeRole}` : ''}`}>إضافة مستخدم</Link>
          </Button>
        }
      />

      {showSkeleton ? (
        <UsersTableSkeleton />
      ) : (
        <>
          <UsersTable
            columns={columns.filter(Boolean) as NonNullable<typeof columns[number]>[]}
            data={users}
            loading={usersQuery.isFetching}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onFunds={handleFunds}
            onEmployeePayments={activeRole === 'employee' ? handleEmployeePayments : undefined}
          />

          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            meta={meta}
          />
        </>
      )}
    </div>
  );
}
