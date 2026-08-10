import { useQuery } from '@tanstack/react-query';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { SearchableSelect } from '@/shared/components/ui/searchable-select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { usersApi } from '@/features/users/api/users.api';
import { projectsApi } from '../projects.api';
import type { Project } from '../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

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

const statuses: { value: Project['status']; label: string }[] = [
  {
    value: 'pending',
    label: 'قيد الانتظار',
  },
  {
    value: 'in_progress',
    label: 'قيد التنفيذ',
  },
  {
    value: 'completed',
    label: 'مكتمل',
  },
  {
    value: 'cancelled',
    label: 'ملغي',
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

      <div className="space-y-1.5">
        <Label>الحالة</Label>
        <Select value={status} onValueChange={(val) => setStatus((val ?? '') as Project['status'] | '')}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="اختر الحالة">
              {status ? (statuses.find((item) => item.value === status)?.label) : 'الكل'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">الكل</SelectItem>
            {statuses.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
