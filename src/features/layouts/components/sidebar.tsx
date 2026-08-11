import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/shared/components/ui/dropdown-menu';
import {
  ChevronDown,
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
  FileText,
  History,
  ArrowLeftRight,
  Undo2,
  X,
  FileX,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { apiClient } from '@/shared/api/axios.instance';
import { NotificationsDropdown } from './notifications-dropdown';

type SidebarProps = {
  onLogout: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
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
    label: 'المستخدمون والأقسام',
    items: [
      { to: '/users', label: 'المستخدمون', icon: Users },
    ],
  },
  {
    label: 'المشاريع',
    items: [
      { to: '/projects', label: 'المشاريع', icon: FolderKanban },
      { to: '/departments', label: 'الأقسام', icon: Building2 },
    ],
  },
  {
    label: 'الإدارة المالية',
    items: [
      { to: '/expenses', label: 'المصروفات', icon: ReceiptText },
      { to: '/revenues', label: 'الإيرادات', icon: TrendingUp },
      { to: '/transfers', label: 'التحويلات', icon: ArrowLeftRight },
      { to: '/employee-payments', label: 'رواتب الموظفين', icon: BadgeDollarSign },
      { to: '/invoices', label: 'الفواتير', icon: FileText },
      { to: '/unposted-invoices', label: 'الفواتير الغير مرحلة', icon: FileX },
      { to: '/re-invoices', label: 'المرتجعات', icon: Undo2 },
      { to: '/invoice-items', label: 'أصناف الفاتورة', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'الصناديق والعملات',
    items: [
      { to: '/funds', label: 'إدارة الصناديق', icon: Wallet },
      { to: '/currencies', label: 'العملات', icon: Banknote },
    ],
  },
  {
    label: 'المواد والبنود',
    items: [
      { to: '/materials', label: 'المواد', icon: Boxes },
      { to: '/items', label: 'البنود', icon: ListChecks },
    ],
  },
  {
    label: 'التخزين',
    items: [
      { to: '/cloud-storage', label: 'التخزين السحابي', icon: Cloud },
      { to: '/audit-logs', label: 'سجل العمليات', icon: History },
    ],
  },
];



function NavGroupComponent({ group, collapsed, onNavigate }: { group: NavGroup; collapsed: boolean; onNavigate?: () => void }) {
  const storageKey = `sidebar-group-${group.label}`;
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved !== null ? saved === 'true' : true;
  });

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  };

  if (collapsed) {
    return (
      <div>
        <div className="my-2 border-t border-sidebar-border/70" />
        <div className="space-y-0.5">
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                title={item.label}
                className={({ isActive }) =>
                  cn(
                    'group mr-4 relative flex items-center justify-center rounded-md px-0 py-2.5 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-sidebar-primary" />
                    )}
                    <Icon className="size-4 shrink-0 opacity-90" />
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          expanded ? "text-sidebar-foreground" : "text-sidebar-foreground/70"
        )}
        onClick={toggleExpanded}
      >
        <span>{group.label}</span>
        {expanded ? <ChevronDown className="size-4 opacity-70" /> : <ChevronLeft className="size-4 opacity-70 rtl:rotate-180" />}
      </button>
      {expanded && (
        <div className="space-y-0.5">
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                title={item.label}
                className={({ isActive }) =>
                  cn(
                    'group mr-4 relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-sidebar-primary" />
                    )}
                    <Icon className="size-4 shrink-0 opacity-90" />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ onLogout, mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== null ? saved === 'true' : false;
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

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
  const displayCollapsed = collapsed && !mobileOpen;

  return (
    <>
    <button
      type="button"
      aria-label="إغلاق القائمة الجانبية"
      onClick={onMobileClose}
      className={cn(
        'fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden',
        mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    />
    <aside
      className={cn(
        'fixed inset-y-0 right-0 z-50 flex h-dvh w-[min(86vw,288px)] flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-300 md:relative md:z-auto md:h-screen md:translate-x-0 md:shadow-none md:transition-[width]',
        mobileOpen ? 'translate-x-0' : 'translate-x-full',
        displayCollapsed ? 'md:w-[76px]' : 'md:w-[248px]'
      )}
    >
      <div className="border-b border-sidebar-border px-3 py-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary/15 text-xs font-bold text-sidebar-primary
               ${displayCollapsed && "!hidden"}`}>
              ن
            </span>
            {!displayCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">نوح المالية</p>
                <p className="truncate text-[11px] text-sidebar-foreground/55">نظام محاسبة وإدارة</p>
              </div>
            ) : null}
          </div>

          <NotificationsDropdown />
          <Button type="button" variant="ghost" size="icon-sm" className="md:hidden" onClick={onMobileClose} aria-label="إغلاق القائمة">
            <X className="size-4" />
          </Button>
        </div>

      </div>

      <div className={cn(
        'flex-1 overflow-y-auto py-2',
        '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sidebar-border/80 hover:[&::-webkit-scrollbar-thumb]:bg-sidebar-foreground/20 transition-colors',
        displayCollapsed ? 'px-2' : 'px-2.5'
      )}>
        <nav className="space-y-1">
          {navGroups.map((group) => (
            <NavGroupComponent key={group.label} group={group} collapsed={displayCollapsed} onNavigate={onMobileClose} />
          ))}
        </nav>
      </div>

      <div className="border-t border-sidebar-border p-3">
        <div className={cn('flex items-center gap-2', displayCollapsed && 'flex-col')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex h-auto w-full items-center rounded-md p-2 text-start transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-none',
                  displayCollapsed ? 'justify-center' : 'gap-3'
                )}
              >
                <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                  <User className="size-4" />
                  <span className="absolute bottom-0 end-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
                </div>
                {!displayCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">{userDisplayName}</p>
                    <p className="truncate text-[11px] text-sidebar-foreground/60">{userRoleName}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={displayCollapsed ? 'center' : 'end'}
              side="top"
              className="mb-2 w-56 border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                  <p className="text-xs leading-none text-sidebar-foreground/70">{userEmail}</p>
                  <p className="text-xs leading-none text-sidebar-foreground/70">{userRoleName}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-sidebar-border" />
              <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600 focus:bg-red-500/10 focus:text-red-600">
                <LogOut className="mr-2 size-4" />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            onClick={toggleSidebar}
            variant="outline"
            size="sm"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-sidebar-border text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:flex"
            aria-label={collapsed ? 'فتح الشريط الجانبي' : 'إغلاق الشريط الجانبي'}
            title={collapsed ? 'فتح الشريط الجانبي' : 'إغلاق الشريط الجانبي'}
          >
            {!collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>
      </div>
    </aside>
    </>
  );
}
