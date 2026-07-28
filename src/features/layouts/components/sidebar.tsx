import { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

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

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300',
        collapsed ? 'w-[76px]' : 'w-[248px]'
      )}
    >
      <div className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center justify-between gap-2">
          {!collapsed ? (
            <div className="min-w-0 space-y-1 px-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary/15 text-xs font-bold text-sidebar-primary">
                  ن
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">نوح المالية</p>
                  <p className="truncate text-[11px] text-sidebar-foreground/55">نظام محاسبة وإدارة</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 justify-center">

            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-sidebar-border text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label={collapsed ? 'فتح الشريط الجانبي' : 'إغلاق الشريط الجانبي'}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>
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
        <Button
          variant="ghost"
          className={cn(
            'h-10 border border-white/20 bg-white/80 text-red-700 hover:bg-white/90 hover:text-sidebar-foreground',
            collapsed ? 'w-full justify-center px-0' : 'w-full justify-start'
          )}
          onClick={onLogout}
          aria-label="تسجيل الخروج"
        >
          <LogOut className="size-4" />
          {!collapsed ? <span>تسجيل الخروج</span> : null}
        </Button>
      </div>
    </aside>
  );
}
