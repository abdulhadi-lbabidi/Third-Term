import { NavLink } from 'react-router-dom';
import {
  LogOut,
  Globe,
  Users,
  Store,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useTranslation } from 'react-i18next';
import { languageStorageKey } from '@/app/i18n';

type SidebarProps = {
  onLogout: () => void;
};

const navItems = [{ to: '/users', label: 'Users', icon: Users }];

export function Sidebar({ onLogout }: SidebarProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  function toggleLanguage() {
    const nextLanguage = isArabic ? 'en' : 'ar';
    window.localStorage.setItem(languageStorageKey, nextLanguage);
    void i18n.changeLanguage(nextLanguage);
  }

  return (
    <aside className="flex h-screen flex-col border-r bg-white">
      <div className="border-b px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-lg font-bold text-[#111827]">Admin</p>
            <p className="text-sm text-[#6b7280]">admin@gmail.com</p>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-[#243b67]">
              ADMIN
            </span>
          </div>

          <button
            type="button"
            className="flex size-14 items-center justify-center rounded-full border border-slate-200 text-[#111827] shadow-sm transition-colors hover:bg-slate-50"
            aria-label="Sidebar action"
          >
            <Store className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <nav className="space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-[22px] px-4 py-4 text-[15px] transition-all',
                    isActive
                      ? 'bg-black text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]'
                      : 'text-[#243b67] hover:bg-black/5'
                  )
                }
              >
                <span className={cn('flex size-12 items-center justify-center rounded-2xl', 'bg-black/5')}>
                  <Icon className="size-5" />
                </span>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t px-4 py-4">
        <div className="flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={toggleLanguage}
            className="h-12 rounded-2xl border-slate-200 bg-white font-bold tracking-[0.28em] text-[#111827]"
          >
            <Globe className="size-4" />
            {isArabic ? 'AR' : 'EN'}
          </Button>
         <Button
          variant="outline"
          className=" h-12 w-fit rounded-2xl border-red-200 bg-red-50 font-bold tracking-[0.28em] text-red-500 hover:bg-red-100 hover:text-red-600"
          onClick={onLogout}
        >
          <LogOut className="size-4" />
          
        </Button>
        </div>

      
      </div>
    </aside>
  );
}
