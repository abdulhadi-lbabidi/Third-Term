import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut, Users, Banknote, Wallet, FolderKanban, ListChecks } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

type SidebarProps = {
  onLogout: () => void;
};

const navItems = [
  { to: '/users', label: 'المستخدمون', icon: Users },
  { to: '/company-funds', label: 'صناديق الشركة', icon: Wallet },
  { to: '/projects', label: 'المشاريع', icon: FolderKanban },
  { to: '/items', label: 'البنود', icon: ListChecks },
  { to: '/currencies', label: 'العملات', icon: Banknote },
];

export function Sidebar({ onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-white transition-all duration-300',
        collapsed ? 'w-[92px]' : 'w-[250px]'
      )}
    >
      <div className="border-b px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          {!collapsed ? (
            <div className="space-y-1">
              <p className="text-lg font-bold text-[#111827]">المدير</p>
              <p className="text-sm text-[#6b7280]">admin@gmail.com</p>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-[#243b67]">
                مدير
              </span>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="flex size-8 items-center justify-center rounded-full border border-slate-200 text-[#111827] shadow-sm transition-colors hover:bg-slate-50"
            aria-label={collapsed ? 'فتح الشريط الجانبي' : 'إغلاق الشريط الجانبي'}
          >
            {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
          </button>
        </div>
      </div>

      <div className={cn('flex-1 overflow-y-auto py-5', collapsed ? 'px-2' : 'px-3')}>
        <nav className="space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-lg py-2 text-sm transition-all',
                    collapsed ? 'justify-center px-0' : 'gap-3 px-2',
                    isActive
                      ? 'bg-black text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]'
                      : 'text-[#243b67] hover:bg-black/5'
                  )
                }
              >
                <span className={cn('flex size-8 items-center justify-center rounded-2xl', 'bg-black/5')}>
                  <Icon className="size-5" />
                </span>
                {!collapsed ? <span className="font-medium">{item.label}</span> : null}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t px-4 py-4">
        <div className={cn('flex gap-3', collapsed ? 'flex-col' : 'justify-between')}>
          <Button
            variant="outline"
            className={cn(
              'h-12 rounded-2xl border-red-200 bg-red-50 font-bold text-red-500 hover:bg-red-100 hover:text-red-600',
              collapsed ? 'w-full justify-center px-0 tracking-[0.12em]' : 'w-fit tracking-[0.28em]'
            )}
            onClick={onLogout}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
