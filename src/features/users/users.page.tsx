import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
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
import { Shield, User, TrendingUp, Hammer, BadgeCheck, HardHat, Truck, Lock, Users, Search, RotateCcw, Plus } from 'lucide-react';
import { SimplePagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog';
import { NewUserPage } from './new-user.page';
import { ImageLightbox } from './components/image-lightbox';
const userRoles: UserRole[] = ['admin', 'client', 'investor', 'craftsman', 'employee', 'engineer', 'supplier', 'trustee'];

const USER_TABS = [
  { value: 'admin', label: 'المدراء', icon: <Shield className="h-4 w-4" /> },
  { value: 'client', label: 'العملاء', icon: <User className="h-4 w-4" /> },
  { value: 'investor', label: 'المستثمرين', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'craftsman', label: 'الحرفيين', icon: <Hammer className="h-4 w-4" /> },
  { value: 'employee', label: 'الموظفين', icon: <BadgeCheck className="h-4 w-4" /> },
  { value: 'engineer', label: 'المهندسين', icon: <HardHat className="h-4 w-4" /> },
  { value: 'supplier', label: 'الموردين', icon: <Truck className="h-4 w-4" /> },
  { value: 'trustee', label: 'الأمانات', icon: <Lock className="h-4 w-4" /> },
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
  byRole: (role: UserRole, page: number, perPage: number, search?: string, sort?: string) => ['users', role, page, perPage, search, sort] as const,
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
            <div key={index} className="grid grid-cols-2 gap-3 rounded-md border border-border p-3 sm:grid-cols-4 lg:grid-cols-6">
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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('tab');
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    return userRoles.includes(initialRole as UserRole) ? (initialRole as UserRole) : 'admin';
  });

  const handleRoleChange = (value: UserRole | null) => {
    if (!value) return;
    setActiveRole(value);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', value);
      return next;
    });
  };

  const [page, setPage] = useState(1);
  const perPage = 50;
  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleSearchSubmit = () => {
    setSearch(searchQuery);
    setPage(1);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearch('');
    setSort(undefined);
    setPage(1);
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && userRoles.includes(tab as UserRole) && tab !== activeRole) {
      setActiveRole(tab as UserRole);
    }
  }, [activeRole, searchParams]);

  useEffect(() => {
    setSearchQuery('');
    setSearch('');
    setSort(undefined);
    setPage(1);
  }, [activeRole]);

  const usersQuery = useQuery<UsersRoleResponse<UsersTabRecord>>({
    queryKey: usersQueryKeys.byRole(activeRole, page, perPage, search, sort),
    queryFn: () => usersApi.getUsersByRole(activeRole, page, perPage, search, sort),
    placeholderData: keepPreviousData,
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
    navigate(`/users/view/${activeRole}/${row.id}?tab=${activeRole}`);
  }

  function handleFunds(row: UsersTabRecord) {
    navigate(`/users/view/${activeRole}/${row.id}?tab=funds`);
  }

  const columns = useMemo(
    () => [
      {
        header: 'الصورة',
        className: 'min-w-20 max-w-28',
        cell: (row: UsersTabRecord) => {
          const images = row.user.all_images || [];
          if (images.length === 0) return <span>-</span>;
          return (
            <div className="flex items-center justify-center gap-1">
              {images.slice(0, 2).map((img, idx) => {
                const isLastAndMore = idx === 1 && images.length > 2;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImages(images.map((i) => i.url));
                      setLightboxIndex(idx);
                      setLightboxOpen(true);
                    }}
                    className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border border-slate-200 transition-all hover:scale-105 p-0 bg-transparent"
                  >
                    <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                    {isLastAndMore && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-bold text-white">
                        +{images.length - 2}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        },
      },
      {
        header: 'الاسم',
        sortable: true,
        sortKey: 'user_name',
        className: 'min-w-40',
        cell: (row: UsersTabRecord) => (
          <button
            type="button"
            onClick={() => handleFunds(row)}
            className="mx-auto block max-w-52 truncate text-center font-medium text-primary hover:underline"
          >
            {row.user.name}
          </button>
        ),
      },
      { header: 'البريد الإلكتروني', className: 'min-w-52', cell: (row: UsersTabRecord) => <span dir="ltr" className="block max-w-64 truncate text-center">{row.user.email}</span> },
      { header: 'الهاتف', className: 'min-w-28', cell: (row: UsersTabRecord) => <span dir="ltr">{row.user.phone_number || '-'}</span> },
      { header: 'العنوان', className: 'min-w-36 max-w-48', cell: (row: UsersTabRecord) => <span className="mx-auto block max-w-64 truncate text-center">{row.user.address || '-'}</span> },
      activeRole === 'investor'
        ? { header: 'نسبة الاستثمار', className: 'min-w-32', cell: (row: UsersTabRecord) => String((row as InvestorRecord).investment_ratio ?? '-') }
        : null,
      activeRole === 'employee'
        ? { header: 'المسمى الوظيفي', className: 'min-w-32', cell: (row: UsersTabRecord) => String((row as EmployeeRecord).job_title ?? '-') }
        : null,
      activeRole === 'employee'
        ? {
            header: 'الحالة',
            className: 'min-w-24',
            cell: (row: UsersTabRecord) => {
              const status = (row as EmployeeRecord).status || 'active';
              const statusLabels: Record<string, string> = {
                active: 'على رأس عمله',
                retired: 'متقاعد',
                resigned: 'مستقيل',
              };
              const statusColors: Record<string, string> = {
                active: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
                retired: 'bg-amber-50 text-amber-700 border-amber-200/60',
                resigned: 'bg-rose-50 text-rose-700 border-rose-200/60',
              };
              return (
                <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${statusColors[status] || 'bg-slate-50 text-slate-700 border-slate-200/60'}`}>
                  {statusLabels[status] || status}
                </span>
              );
            }
          }
        : null,
      activeRole === 'engineer'
        ? { header: 'المسمى الوظيفي', className: 'min-w-32', cell: (row: UsersTabRecord) => String((row as EngineerRecord).job_title ?? '-') }
        : null,
      activeRole === 'engineer'
        ? { header: 'الراتب الأساسي', className: 'min-w-32', cell: (row: UsersTabRecord) => String((row as EngineerRecord).base_salary ?? '-') }
        : null,
      activeRole === 'employee' || activeRole === 'engineer'
        ? {
            header: 'القسم',
            className: 'min-w-40',
            cell: (row: UsersTabRecord) => {
              const dept = 'department' in row ? (row as any).department : null;
              return dept?.name || '-';
            }
          }
        : null,

      { header: 'تاريخ الإنشاء', sortable: true, sortKey: 'created_at', className: 'min-w-32', cell: (row: UsersTabRecord) => dayjs(row.created_at).format('YYYY-MM-DD') },
    ],
    [activeRole]
  );

  const showSkeleton = usersQuery.isFetching && !usersQuery.data;
  const users = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? page;

  const currentTab = USER_TABS.find((tab) => tab.value === activeRole);
  const activeTitle = currentTab?.label || 'المستخدمون';

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        badge="المستخدمون"
        title={
          <div className="flex items-center gap-2">
            <span>{activeTitle}</span>
            {meta?.total !== undefined && (
              <span className="inline-flex items-center justify-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {meta.total}
              </span>
            )}
          </div>
        }
        icon={Users}
        action={
          <form
            className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearchSubmit();
            }}
          >
            <Select value={activeRole} onValueChange={(value) => value && handleRoleChange(value)}>
              <SelectTrigger className="h-10 w-full sm:w-48 shrink-0">
                <SelectValue placeholder="اختر النوع">
                  {(() => {
                    const currentTab = USER_TABS.find((tab) => tab.value === activeRole);
                    if (!currentTab) return null;
                    return (
                      <div className="flex items-center gap-2">
                        {currentTab.icon}
                        <span>{currentTab.label}</span>
                      </div>
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {USER_TABS.map((tab) => (
                  <SelectItem key={tab.value} value={tab.value}>
                    <div className="flex items-center gap-2">
                      {tab.icon}
                      <span>{tab.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full sm:min-w-72 sm:flex-1 lg:w-80">
              <button
                type="submit"
                aria-label="بحث"
                className="absolute end-1 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Search className="size-4" />
              </button>
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                className="h-10 pe-11"
              />
            </div>
            {(searchQuery || sort) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                size="icon"
                aria-label="إعادة ضبط البحث والترتيب"
                title="إعادة ضبط البحث والترتيب"
              >
                <RotateCcw className="size-4" />
              </Button>
            )}
            <Button
              type="button"
              className="min-w-0 flex-1 sm:flex-none"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="size-4" />
              إضافة مستخدم
            </Button>
          </form>
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
            onView={handleEdit}
            onFunds={handleFunds}
            sort={sort}
            onSortChange={setSort}
          />

          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            meta={meta}
          />
        </>
      )}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] !max-w-5xl overflow-y-auto p-0">
          <DialogTitle className="sr-only">إضافة مستخدم</DialogTitle>
          {createDialogOpen && (
            <NewUserPage embedded createRole={activeRole} onClose={() => setCreateDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
}
