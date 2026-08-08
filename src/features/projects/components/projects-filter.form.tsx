import { useQuery } from '@tanstack/react-query';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { usersApi } from '@/features/users/api/users.api';
import { projectsApi } from '../projects.api';
import type { Project } from '../types';
import { cn } from '@/shared/lib/utils';

export type ProjectsFilterFormProps = {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  clientId: number | '';
  setClientId: (val: number | '') => void;
  departmentId: number | '';
  setDepartmentId: (val: number | '') => void;
  status: Project['status'] | '';
  setStatus: (val: Project['status'] | '') => void;
};

const statuses: { value: Project['status']; label: string; activeClass: string; hoverClass: string }[] = [
  {
    value: 'pending',
    label: 'قيد الانتظار',
    activeClass: 'bg-amber-50 border-amber-300 text-amber-700 border-2 font-semibold shadow-sm',
    hoverClass: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200',
  },
  {
    value: 'in_progress',
    label: 'قيد التنفيذ',
    activeClass: 'bg-blue-50 border-blue-300 text-blue-700 border-2 font-semibold shadow-sm',
    hoverClass: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200',
  },
  {
    value: 'completed',
    label: 'مكتمل',
    activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-700 border-2 font-semibold shadow-sm',
    hoverClass: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200',
  },
  {
    value: 'cancelled',
    label: 'ملغي',
    activeClass: 'bg-rose-50 border-rose-300 text-rose-700 border-2 font-semibold shadow-sm',
    hoverClass: 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200',
  },
];

export function ProjectsFilterForm({
  searchQuery,
  setSearchQuery,
  clientId,
  setClientId,
  departmentId,
  setDepartmentId,
  status,
  setStatus,
}: ProjectsFilterFormProps) {
  const clientsQuery = useQuery({
    queryKey: ['filter-clients'] as const,
    queryFn: () => usersApi.getUsersByRole('client', 1, 1000).then((res) => res.data),
  });

  const departmentsQuery = useQuery({
    queryKey: ['filter-departments'] as const,
    queryFn: () => projectsApi.getDepartments(),
  });

  const clients = clientsQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="filter-search">البحث</Label>
        <Input
          id="filter-search"
          type="text"
          placeholder="البحث باسم المشروع..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>العميل</Label>
        {clientsQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <SearchableSelect
            value={clientId || null}
            onValueChange={(val) => setClientId(val ? Number(val) : '')}
            placeholder="اختر العميل"
            searchPlaceholder="البحث عن عميل..."
            emptyMessage="لا يوجد عملاء."
            options={clients.map((c: any) => ({
              value: c.id,
              label: c.user?.name || '-',
            }))}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label>القسم</Label>
        {departmentsQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <SearchableSelect
            value={departmentId || null}
            onValueChange={(val) => setDepartmentId(val ? Number(val) : '')}
            placeholder="اختر القسم"
            searchPlaceholder="البحث عن قسم..."
            emptyMessage="لا توجد أقسام."
            options={departments.map((d: any) => ({
              value: d.id,
              label: d.name || '-',
            }))}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label>الحالة</Label>
        <div className="grid grid-cols-2 gap-2">
          {statuses.map((item) => {
            const isSelected = status === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatus(isSelected ? '' : item.value)}
                className={cn(
                  "flex h-11 items-center justify-center rounded-lg border text-xs transition-all duration-200 cursor-pointer",
                  isSelected
                    ? item.activeClass
                    : "bg-background text-muted-foreground border-border hover:border-muted-foreground/30",
                  !isSelected && item.hoverClass
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
