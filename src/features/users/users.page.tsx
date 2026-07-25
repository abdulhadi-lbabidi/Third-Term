import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeRole, setActiveRole] = useState<UserRole>('admin');

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
    navigate(`/users/edit/${activeRole}/${row.id}`);
  }

  function handleFunds(row: UsersTabRecord) {
    navigate(`/users/${row.user.id}/${encodeURIComponent(row.user.name)}/funds`);
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

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              المستخدمون
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">المستخدمون</h1>
          </div>
          <Button asChild className="h-11 rounded-2xl bg-slate-950 px-5 text-sm font-semibold shadow-sm hover:bg-slate-800">
            <Link to="/users/new">إضافة مستخدم</Link>
          </Button>
        </div>
      </div>

      <UserTabs roles={userRoles} activeRole={activeRole} onChange={setActiveRole} />

      <UsersTable
        columns={columns.filter(Boolean) as NonNullable<typeof columns[number]>[]}
        data={usersQuery.data ?? []}
        loading={usersQuery.isLoading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onFunds={handleFunds}
        onEmployeePayments={activeRole === 'employee' ? handleEmployeePayments : undefined}
      />
    </div>
  );
}
