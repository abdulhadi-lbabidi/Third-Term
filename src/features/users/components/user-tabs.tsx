import { cn } from '@/shared/lib/utils';
import type { UserRole } from '../types';

type UserTabsProps = {
  roles: UserRole[];
  activeRole: UserRole;
  onChange: (role: UserRole) => void;
};

const roleLabels: Record<UserRole, string> = {
  admin: 'المدير',
  client: 'العميل',
  investor: 'المستثمر',
  craftsman: 'الحرفي',
  employee: 'الموظف',
  engineer: 'المهندس',
  supplier: 'المورد',
  trustee: 'الأمين',
};

export function UserTabs({ roles, activeRole, onChange }: UserTabsProps) {
  return (
    <div className="surface-panel p-3">
      <div className="flex flex-wrap gap-1.5">
        {roles.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            className={cn(
              'rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
              activeRole === role
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {roleLabels[role]}
          </button>
        ))}
      </div>
    </div>
  );
}
