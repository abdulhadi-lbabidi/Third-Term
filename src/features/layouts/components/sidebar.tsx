import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Banknote,
  Wallet,
  FolderKanban,
  ListChecks,
  BadgeDollarSign,
  Building2,
  Cloud,
  ReceiptText,
  Boxes,
  FileSpreadsheet,
  User,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { apiClient } from '@/shared/api/axios.instance';
import { NotificationsDropdown } from './notifications-dropdown';

type SidebarProps = {
  onLogout: () => void;
};

type NavItem = {
  to: string;
  label: string;
  icon: typeof Users;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role_type?: string;
};


const navGroups: NavGroup[] = [
  {
    label: 'الإدارة المالية',
    items: [
      { to: '/expenses', label: 'المصروفات', icon: ReceiptText },
      { to: '/revenues', label: 'الإيرادات', icon: TrendingUp },
      { to: '/invoice-items', label: 'أصناف الفاتورة', icon: FileSpreadsheet },
      { to: '/employee-payments', label: 'رواتب الموظفين', icon: BadgeDollarSign },
    ],
  },
  {
    label: 'الصناديق والعملات',
    items: [
      { to: '/company-funds', label: 'صناديق الشركة', icon: Wallet },
      { to: '/currencies', label: 'العملات', icon: Banknote },
    ],
  },
  {
    label: 'المشاريع',
    items: [{ to: '/projects', label: 'المشاريع', icon: FolderKanban }],
  },
  {
    label: 'المواد والبنود',
    items: [
      { to: '/materials', label: 'المواد', icon: Boxes },
      { to: '/items', label: 'البنود', icon: ListChecks },
    ],
  },
  {
    label: 'المستخدمون والأقسام',
    items: [
      { to: '/users', label: 'المستخدمون', icon: Users },
      { to: '/departments', label: 'الأقسام', icon: Building2 },
    ],
  },
  {
    label: 'التخزين',
    items: [{ to: '/cloud-storage', label: 'التخزين السحابي', icon: Cloud }],
  },
];



export function Sidebar({ onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const { data: currentUser } = useQuery<UserProfile | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/me');
        return response.data?.data ?? response.data ?? null;
      } catch {
        const cached = localStorage.getItem('user_info');
        return cached ? JSON.parse(cached) : null;
      }
    },
  });

  const userDisplayName = currentUser?.name || 'سامر كمال الدسوقي';
  const userEmail = currentUser?.email || 'admin_1@example.com';
  const userRoleName = currentUser?.role_type === 'user' ? 'مستخدم' : currentUser?.role_type || 'Admin';

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300',
        collapsed ? 'w-[76px]' : 'w-[248px]'
      )}
    >
      <div className="border-b border-sidebar-border px-3 py-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary/15 text-xs font-bold text-sidebar-primary
               ${collapsed && "!hidden"}`}>
              ن
            </span>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">نوح المالية</p>
                <p className="truncate text-[11px] text-sidebar-foreground/55">نظام محاسبة وإدارة</p>
              </div>
            ) : null}
          </div>

          <NotificationsDropdown />
        </div>

        {!collapsed ? (
          <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 p-2.5">
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              <User className="size-5" />
              <span className="absolute bottom-0 end-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">{userDisplayName}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">{userEmail}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/50">{userRoleName}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1" title={`${userDisplayName} (${userEmail} - ${userRoleName})`}>
            <div className="relative flex size-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              <User className="size-4" />
              <span className="absolute bottom-0 end-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
            </div>
          </div>
        )}
      </div>

      <div className={cn('flex-1 overflow-y-auto py-2', collapsed ? 'px-2' : 'px-2.5')}>
        <nav className="space-y-1">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed ? <p className="nav-group-label">{group.label}</p> : <div className="my-2 border-t border-sidebar-border/70" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={item.label}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center rounded-md text-[13px] font-medium transition-colors',
                          collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-2.5 py-2',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive ? (
                            <span className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-sidebar-primary" />
                          ) : null}
                          <Icon className="size-4 shrink-0 opacity-90" />
                          {!collapsed ? <span className="truncate">{item.label}</span> : null}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-sidebar-border p-3">
        <div className={cn('flex items-center gap-2', collapsed && 'flex-col')}>
          <Button
            variant="ghost"
            className={cn(
              'h-9 border border-red-200/60 bg-red-50/50 text-red-700 hover:bg-red-100/70 hover:text-red-800',
              collapsed ? 'w-full justify-center px-0' : 'flex-1 justify-start gap-2'
            )}
            onClick={onLogout}
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
          >
            <LogOut className="size-4 shrink-0" />
            {!collapsed ? <span>تسجيل الخروج</span> : null}
          </Button>
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-sidebar-border text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label={collapsed ? 'فتح الشريط الجانبي' : 'إغلاق الشريط الجانبي'}
            title={collapsed ? 'فتح الشريط الجانبي' : 'إغلاق الشريط الجانبي'}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
