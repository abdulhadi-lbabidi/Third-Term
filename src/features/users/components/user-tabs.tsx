import { cn } from '@/shared/lib/utils';
import { useTranslation } from 'react-i18next';
import type { UserRole } from '../types';

type UserTabsProps = {
  roles: UserRole[];
  activeRole: UserRole;
  onChange: (role: UserRole) => void;
};

export function UserTabs({ roles, activeRole, onChange }: UserTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            className={cn(
              'rounded-full px-5 py-2.5 text-sm font-medium capitalize transition-all',
              activeRole === role
                ? 'bg-slate-950 text-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200/80 hover:text-slate-900'
            )}
          >
            {t(`users.tabs.${role}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
