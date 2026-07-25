import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
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

type UsersTabRecord =
  | AdminRecord
  | ClientRecord
  | InvestorRecord
  | CraftsmanRecord
  | EmployeeRecord
  | EngineerRecord
  | SupplierRecord
  | TrusteeRecord;

export function UsersPage() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [users, setUsers] = useState<UsersTabRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      setLoading(true);
      try {
        const response = await usersApi.getUsersByRole(activeRole);
        if (mounted) {
          setUsers(response);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      mounted = false;
    };
  }, [activeRole]);

  async function handleDelete(row: UsersTabRecord) {
    await usersApi.deleteUserByRole(activeRole, row.id);
    setUsers((current) => current.filter((item) => item.id !== row.id));
  }

  function handleEdit(row: UsersTabRecord) {
    navigate(`/users/edit/${activeRole}/${row.id}`);
  }

  function handleFunds(row: UsersTabRecord) {
    navigate(`/users/${row.user.id}/funds`);
  }

  const columns = useMemo(
    () => [
      {
        header: 'الاسم',
        cell: (row: UsersTabRecord) => row.user.name,
      },
      {
        header: 'البريد الإلكتروني',
        cell: (row: UsersTabRecord) => row.user.email,
      },
      {
        header: 'الهاتف',
        cell: (row: UsersTabRecord) => row.user.phone_number,
      },
      {
        header: 'العنوان',
        cell: (row: UsersTabRecord) => row.user.address,
      },
      activeRole === 'investor'
        ? {
            header: 'نسبة الاستثمار',
            cell: (row: UsersTabRecord) => String((row as InvestorRecord).investment_ratio ?? '-'),
          }
        : null,
      activeRole === 'employee'
        ? {
            header: 'المسمى الوظيفي',
            cell: (row: UsersTabRecord) => String((row as EmployeeRecord).job_title ?? '-'),
          }
        : null,
      activeRole === 'engineer'
        ? {
            header: 'المسمى الوظيفي',
            cell: (row: UsersTabRecord) => String((row as EngineerRecord).job_title ?? '-'),
          }
        : null,
      activeRole === 'engineer'
        ? {
            header: 'الراتب الأساسي',
            cell: (row: UsersTabRecord) => String((row as EngineerRecord).base_salary ?? '-'),
          }
        : null,
      activeRole === 'trustee'
        ? {
            header: 'صلة القرابة',
            cell: (row: UsersTabRecord) => String((row as TrusteeRecord).kinship_relation ?? '-'),
          }
        : null,
      {
        header: 'تاريخ الإنشاء',
        cell: (row: UsersTabRecord) => dayjs(row.created_at).format('YYYY-MM-DD'),
      },
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
        data={users}
        loading={loading}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onFunds={handleFunds}
      />
    </div>
  );
}
